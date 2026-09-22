// Seed is applied programmatically from backend graph sync.
// This file documents the intended graph shape for SIH PS 26151.

MERGE (a:Actor {id: 'ACT-001'})
  SET a.display_name = 'Nexus Cluster';
MERGE (al:Alias {id: 'ALS-001', value: 'shadow_x'});
MERGE (a)-[:USES_ALIAS]->(al);
MERGE (p:PGP {id: 'PGP-001'});
MERGE (a)-[:USES_PGP]->(p);
MERGE (w:Wallet {id: 'WLT-001'});
MERGE (a)-[:USES_WALLET]->(w);
MERGE (o:OnionService {id: 'ONION-001', address: 'demo123.onion'});
MERGE (d:ClearnetDomain {id: 'demo.example.test'});
MERGE (o)-[:CONNECTED_TO]->(d);
MERGE (a)-[:ASSOCIATED_WITH]->(o);
MERGE (b:Actor {id: 'ACT-014'});
MERGE (a)-[:CORRELATED_WITH {type: 'USES_PGP', confidence: 'HIGH'}]->(b);
MERGE (a)-[:MIGRATED_TO {from_alias: 'shadow_x', to_alias: 'shadow_reborn'}]->(a);
