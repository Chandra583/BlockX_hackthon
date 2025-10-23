# Telemetry Batch Anchoring Data Flow

```mermaid
graph TB
    A[ESP32 Device] -->|POST /api/device/status| B[Device Controller]
    B --> C[VehicleTelemetry Collection]
    B --> D[Immediate Trigger Check]
    D -->|End of Day| E[TelemetryConsolidationService]
    
    F[Daily Job Scheduler] -->|2 AM UTC| E
    E --> G[Query Telemetry Segments]
    G --> H[MerkleTreeBuilder]
    H --> I[Build Merkle Tree]
    I --> J[Upload to Arweave]
    J --> K[Anchor to Solana]
    K --> L[Update TelemetryBatch]
    
    M[Frontend] -->|GET /telemetry-batches| N[API Endpoint]
    N --> O[Query TelemetryBatch]
    O --> P[Return with TX Hashes]
    P --> Q[Display with Explorer Links]
    
    R[Manual Consolidation] -->|POST /consolidate-batch| E
    
    style A fill:#e1f5fe
    style E fill:#f3e5f5
    style H fill:#fff3e0
    style J fill:#e8f5e8
    style K fill:#fff8e1
    style L fill:#fce4ec
```

## Key Components:

1. **ESP32 Device**: Sends telemetry data via HTTP POST
2. **Device Controller**: Processes data and triggers immediate consolidation
3. **TelemetryConsolidationService**: Main service for batch processing
4. **MerkleTreeBuilder**: Creates deterministic Merkle trees
5. **Arweave Service**: Uploads data for permanent storage
6. **Solana Service**: Anchors Merkle root to blockchain
7. **Daily Job**: Nightly consolidation for all vehicles
8. **Frontend**: Displays batches with transaction links
