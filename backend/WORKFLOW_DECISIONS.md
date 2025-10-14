## Adopted Workflow Decisions

- OBD/ESP32 device installation: Admin assigns a specific provider to each install job. Providers can accept or decline; admins can reassign.
- Batching: Trip-based aggregation during the day; daily finalize and submit to blockchain at midnight (max 24h finality).
- Marketplace listings: Auto-generate a signed, immutable vehicle history report at listing time and store on Arweave; link in listing.
- Previous-node validation: Validate against both last on-chain transaction and last DB mileage. On conflict, prefer on-chain as source of truth, log reconciliation and block submission until resolved.

These defaults drive upcoming schema, endpoints, and UI work.


