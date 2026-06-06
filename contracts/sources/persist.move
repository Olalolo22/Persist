/// Persist — Cryptographic Access Control for Encrypted Digital Assets
///
/// This module defines `PersistCapsule`, a shared object that acts as the
/// access policy for Sui Seal's threshold decryption service. The capsule
/// stores metadata (Walrus blob ID, nominee, release date) and exposes a
/// `seal_approve` entry function that key servers dry-run to decide whether
/// to release decryption keys.
///
/// Architecture:
///   Sui (truth) → Seal (encryption gate) → Walrus (encrypted storage)
///
/// Release logic:
///   IF caller == nominee AND time >= release_time AND status == LOCKED
///   THEN allow decryption
///
/// The encrypted payload (content + epitaph) lives on Walrus.
/// Nothing sensitive is stored on-chain.

module persist::capsule {
    use std::vector;
    use sui::clock::Clock;
    use sui::event;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    // ────────────────────────────────────────────────────────────────
    // Error codes
    // ────────────────────────────────────────────────────────────────

    const ENotNominee: u64 = 0;
    const ENotActive: u64 = 1;
    const ENotReady: u64 = 2;
    const ENotCreator: u64 = 3;
    const EInvalidReleaseTime: u64 = 4;
    const EInvalidNominee: u64 = 5;
    const EInvalidId: u64 = 6;
    const EAlreadySealed: u64 = 7;

    // ────────────────────────────────────────────────────────────────
    // Status constants
    // ────────────────────────────────────────────────────────────────

    const STATUS_LOCKED: u8 = 0;
    const STATUS_CLAIMED: u8 = 1;

    // ────────────────────────────────────────────────────────────────
    // Core object
    // ────────────────────────────────────────────────────────────────

    /// A sealed digital capsule. Shared object so the nominee can access it.
    ///
    /// Fields are intentionally minimal — all sensitive data lives in the
    /// Seal-encrypted Walrus blob. On-chain we store only what `seal_approve`
    /// needs to evaluate the release condition.
    public struct PersistCapsule has key, store {
        id: UID,
        /// Walrus blob ID of the Seal-encrypted payload
        walrus_blob_id: vector<u8>,
        /// Address that created this capsule
        creator: address,
        /// Address allowed to decrypt after release
        nominee: address,
        /// Unix timestamp (ms) when decryption becomes allowed
        release_time_ms: u64,
        /// 0 = LOCKED, 1 = CLAIMED
        status: u8,
    }

    // ────────────────────────────────────────────────────────────────
    // Events
    // ────────────────────────────────────────────────────────────────

    public struct CapsuleCreated has copy, drop {
        capsule_id: ID,
        creator: address,
        nominee: address,
        release_time_ms: u64,
    }

    public struct CapsuleClaimed has copy, drop {
        capsule_id: ID,
        nominee: address,
    }

    // ────────────────────────────────────────────────────────────────
    // Seal access gate
    // ────────────────────────────────────────────────────────────────

    /// Called by Seal key servers via dry-run to evaluate whether
    /// decryption is permitted.
    ///
    /// Requirements (per Seal convention):
    ///   - Must be `entry` (not `public entry`) to prevent composition
    ///   - First parameter must be `vector<u8>` (the encryption identity)
    ///   - Must not return values or modify state
    ///   - Access denied = assertion failure → key servers refuse decryption
    entry fun seal_approve(
        id: vector<u8>,
        capsule: &PersistCapsule,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        // Verify the requested decryption ID matches this capsule's object ID.
        // This is critical to prevent a claimant from using a fake/different capsule
        // to decrypt this capsule's payload.
        assert!(id == object::id_to_bytes(&object::uid_to_inner(&capsule.id)), EInvalidId);

        // 1. Caller must be the designated nominee
        assert!(ctx.sender() == capsule.nominee, ENotNominee);

        // 3. Release time must have passed
        assert!(clock.timestamp_ms() >= capsule.release_time_ms, ENotReady);
    }

    // ────────────────────────────────────────────────────────────────
    // Creator actions
    // ────────────────────────────────────────────────────────────────

    /// Create a new capsule. The encrypted payload can be uploaded before
    /// (one-step) or after (two-step) creating the capsule.
    ///
    /// Validations:
    ///   - release_time must be in the future
    ///   - nominee cannot be the creator (you can't seal something for yourself)
    entry fun create_capsule(
        walrus_blob_id: vector<u8>,
        nominee: address,
        release_time_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let creator = ctx.sender();

        // Release must be in the future
        assert!(release_time_ms > clock.timestamp_ms(), EInvalidReleaseTime);

        // Nominee cannot be the creator
        assert!(nominee != creator, EInvalidNominee);

        let uid = object::new(ctx);
        let capsule_id = uid.to_inner();

        let capsule = PersistCapsule {
            id: uid,
            walrus_blob_id,
            creator,
            nominee,
            release_time_ms,
            status: STATUS_LOCKED,
        };

        event::emit(CapsuleCreated {
            capsule_id,
            creator,
            nominee,
            release_time_ms,
        });

        transfer::share_object(capsule);
    }

    /// Update the Walrus blob ID for a capsule.
    /// Used in the two-step flow where the capsule is created first (to get its object ID),
    /// the payload is encrypted using that object ID and uploaded to Walrus,
    /// and then the blob ID is stored on-chain.
    entry fun update_blob_id(
        capsule: &mut PersistCapsule,
        walrus_blob_id: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(ctx.sender() == capsule.creator, ENotCreator);
        // Can only set the blob ID once to prevent updates after sealing
        assert!(vector::is_empty(&capsule.walrus_blob_id), EAlreadySealed);
        capsule.walrus_blob_id = walrus_blob_id;
    }

    // ────────────────────────────────────────────────────────────────
    // Nominee actions
    // ────────────────────────────────────────────────────────────────

    /// Mark the capsule as claimed. Called by the nominee after they
    /// have successfully decrypted the Walrus payload via Seal.
    ///
    /// This is a courtesy on-chain record — it prevents re-decryption
    /// and lets the creator's dashboard show "CLAIMED" status.
    entry fun claim_capsule(
        capsule: &mut PersistCapsule,
        ctx: &TxContext,
    ) {
        assert!(ctx.sender() == capsule.nominee, ENotNominee);
        assert!(capsule.status == STATUS_LOCKED, ENotActive);
        capsule.status = STATUS_CLAIMED;

        event::emit(CapsuleClaimed {
            capsule_id: capsule.id.to_inner(),
            nominee: ctx.sender(),
        });
    }

    // ────────────────────────────────────────────────────────────────
    // Read-only accessors (for frontend queries via devInspect)
    // ────────────────────────────────────────────────────────────────

    public fun get_status(capsule: &PersistCapsule): u8 { capsule.status }
    public fun get_creator(capsule: &PersistCapsule): address { capsule.creator }
    public fun get_nominee(capsule: &PersistCapsule): address { capsule.nominee }
    public fun get_walrus_blob_id(capsule: &PersistCapsule): &vector<u8> { &capsule.walrus_blob_id }
    public fun get_release_time_ms(capsule: &PersistCapsule): u64 { capsule.release_time_ms }
}
