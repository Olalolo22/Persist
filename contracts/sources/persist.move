module persist::capsule {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::String;

    /// The Persist Capsule object. 
    /// This holds the reference to the encrypted data on Walrus and the unlock conditions.
    struct PersistCapsule has key, store {
        id: UID,
        /// The Walrus Blob ID containing the AES-GCM encrypted file/message
        walrus_blob_id: String,
        /// The AES key encrypted (for now, just stored, later ECIES-wrapped to nominee)
        encrypted_aes_key: vector<u8>,
        /// The address of the creator
        creator: address,
        /// The address of the nominee who can claim this capsule
        nominee: address,
        /// Optional: Fixed unlock timestamp in milliseconds (0 if unused)
        unlock_time_ms: u64,
        /// Optional: Dead man's switch - timestamp of last known activity (0 if unused)
        last_active_timestamp_ms: u64,
        /// Optional: Dead man's switch - how many ms of inactivity triggers unlock (0 if unused)
        dms_timeout_ms: u64,
        /// The final on-chain message
        epitaph: String,
        /// Status: 0 = active, 1 = claimed
        status: u8,
    }

    /// Event emitted when a capsule is created
    struct CapsuleCreated has copy, drop {
        capsule_id: object::ID,
        creator: address,
        nominee: address,
        walrus_blob_id: String,
    }

    /// Creates a new Persist Capsule and shares it.
    public entry fun create_capsule(
        walrus_blob_id: String,
        encrypted_aes_key: vector<u8>,
        nominee: address,
        unlock_time_ms: u64,
        dms_timeout_ms: u64,
        epitaph: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);
        let id = object::new(ctx);
        let capsule_id = object::uid_to_inner(&id);
        
        let last_active = if (dms_timeout_ms > 0) {
            clock::timestamp_ms(clock)
        } else {
            0
        };

        let capsule = PersistCapsule {
            id,
            walrus_blob_id,
            encrypted_aes_key,
            creator,
            nominee,
            unlock_time_ms,
            last_active_timestamp_ms: last_active,
            dms_timeout_ms,
            epitaph,
            status: 0,
        };

        event::emit(CapsuleCreated {
            capsule_id,
            creator,
            nominee,
            walrus_blob_id: capsule.walrus_blob_id,
        });

        // Share the object so the nominee can claim it later
        transfer::share_object(capsule);
    }

    // --- Dead Man's Switch: Check-In ---

    /// Creator calls this to prove they're still alive. Resets the DMS timer.
    public entry fun check_in(
        capsule: &mut PersistCapsule,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == capsule.creator, 0); // Only creator
        assert!(capsule.status == 0, 1); // Must be active
        assert!(capsule.dms_timeout_ms > 0, 2); // Must have DMS enabled

        capsule.last_active_timestamp_ms = clock::timestamp_ms(clock);
    }

    // --- Claim ---

    /// Event emitted when a capsule is claimed
    struct CapsuleClaimed has copy, drop {
        capsule_id: object::ID,
        nominee: address,
        epitaph: String,
    }

    /// Nominee calls this to claim the capsule.
    /// Succeeds only if:
    ///   - caller is the nominee
    ///   - capsule is active (status == 0)
    ///   - at least one unlock condition is met:
    ///     a) Fixed date has passed (unlock_time_ms > 0 && now >= unlock_time_ms)
    ///     b) DMS has timed out (dms_timeout_ms > 0 && now >= last_active + dms_timeout_ms)
    public entry fun claim_capsule(
        capsule: &mut PersistCapsule,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == capsule.nominee, 3); // Only nominee
        assert!(capsule.status == 0, 4); // Must be active

        let now = clock::timestamp_ms(clock);

        // Check if at least one unlock condition is met
        let date_unlocked = capsule.unlock_time_ms > 0 && now >= capsule.unlock_time_ms;
        let dms_unlocked = capsule.dms_timeout_ms > 0 
            && now >= capsule.last_active_timestamp_ms + capsule.dms_timeout_ms;

        assert!(date_unlocked || dms_unlocked, 5); // No condition met

        capsule.status = 1; // Mark as claimed

        event::emit(CapsuleClaimed {
            capsule_id: object::uid_to_inner(&capsule.id),
            nominee: caller,
            epitaph: capsule.epitaph,
        });
    }

    // --- Read-only accessors (for frontend to query capsule state) ---

    public fun get_status(capsule: &PersistCapsule): u8 { capsule.status }
    public fun get_creator(capsule: &PersistCapsule): address { capsule.creator }
    public fun get_nominee(capsule: &PersistCapsule): address { capsule.nominee }
    public fun get_walrus_blob_id(capsule: &PersistCapsule): &String { &capsule.walrus_blob_id }
    public fun get_encrypted_aes_key(capsule: &PersistCapsule): &vector<u8> { &capsule.encrypted_aes_key }
    public fun get_epitaph(capsule: &PersistCapsule): &String { &capsule.epitaph }
    public fun get_unlock_time_ms(capsule: &PersistCapsule): u64 { capsule.unlock_time_ms }
    public fun get_last_active_ms(capsule: &PersistCapsule): u64 { capsule.last_active_timestamp_ms }
    public fun get_dms_timeout_ms(capsule: &PersistCapsule): u64 { capsule.dms_timeout_ms }
}
