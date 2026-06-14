# Deploying Persist Frontend to Walrus Sites (for Sui Overflow Walrus track)

This makes the entire app decentralized (one of the 3 Walrus layers: blobs + Memory + Sites).

## 1. Build static export
```bash
npm run build:static
# outputs to ./out
```

(If using Next 14+ with output:'export' in next.config, just `npm run build` produces the static files.)

## 2. Install Walrus CLI / use publisher (if not already)
- Follow https://docs.wal.app/ for the CLI or use the web publisher.
- For testnet: the same aggregator/publisher as in the code.

## 3. Upload the site
Typical command (after having site resources):
```bash
walrus publish-site --epochs 5 ./out
# or use the publisher UI / relay for the directory
```

The result is a Walrus Site ID / URL like `https://<site-id>.walrus.site` or via aggregator.

## 4. Update references
- Add the final Walrus Site URL to README, landing footer, pitch.
- In production the app should prefer direct aggregator URLs for fetches (the /api/walrus proxy is dev only).

## Notes
- Some dynamic features (Sui wallet connect) still work because they are client-side + on-chain.
- The old /api/attest etc stay on the "convenience" layer; the core (capsules, blobs, agent self-capsules) are fully on Walrus + Sui.
- For the demo video, load the site from the Walrus URL to prove decentralization.

This + the deep agent Memory usage + encrypted payloads = the "three layers of Walrus integration" for the track submission.
