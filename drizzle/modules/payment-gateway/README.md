# Optional Payment Gateway Module (separate from Core)

Scaffold only. Core POS/QR/manual transfer/cash must work without this module.
Do not mix with core migrations/journal. No mandatory core FKs to gateway tables. Apply dev first with explicit approval; store secrets in env/secret manager.
