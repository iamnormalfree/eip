// ABOUTME: Neo4j mirror implementation - Complete TDD implementation
// ABOUTME: Implements mirrorSupabaseToNeo4j with full node creation, edge relationships, and incremental updates

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import neo4j, { Driver, Session, Record, Integer } from 'neo4j-driver';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export interface MirrorOptions {
  since?: string;
  graphSparse?: boolean;
}

export interface MirrorResult {
  success: boolean;
  nodesCreated: number;
  edgesCreated: number;
  flags: {
    graphSparse: boolean;
    incrementalMode: boolean;
    hasErrors: boolean;
  };
  performance: {
    duration: number;
    batchCount: number;
    nodesProcessed: number;
  };
  nextCursor: string;
  error?: string;
  warnings?: string[];
}

// Batch size for processing
const BATCH_SIZE = 100;

/**
 * Mirrors Supabase data to Neo4j graph database
 * Implements TDD approach with comprehensive test coverage
 */
export async function mirrorSupabaseToNeo4j(options: MirrorOptions = {}): Promise<MirrorResult> {
  const startTime = Date.now();
  const { since, graphSparse = false } = options;
  
  let neo4jDriver: Driver | null = null;
  let supabaseClient: SupabaseClient | null = null;
  let nodesCreated = 0;
  let edgesCreated = 0;
  let batchCount = 0;
  let nodesProcessed = 0;
  const warnings: string[] = [];
  
  try {
    // Initialize Neo4j connection
    neo4jDriver = await initializeNeo4jDriver();
    
    // Initialize Supabase connection
    supabaseClient = initializeSupabaseClient();
    
    console.log('Starting mirror operation...', { 
      since: since || 'full', 
      graphSparse,
      timestamp: new Date().toISOString() 
    });
    
    // Process nodes for each entity type
    const nodeResults = await Promise.allSettled([
      processConceptNodes(neo4jDriver, supabaseClient, since, graphSparse),
      processPersonaNodes(neo4jDriver, supabaseClient, since, graphSparse),
      processOfferNodes(neo4jDriver, supabaseClient, since, graphSparse),
      processEvidenceNodes(neo4jDriver, supabaseClient, since, graphSparse),
      processArtifactNodes(neo4jDriver, supabaseClient, since, graphSparse)
    ]);
    
    // Process edges from artifacts
    const edgeResults = await Promise.allSettled([
      processArtifactEdges(neo4jDriver, supabaseClient, since, graphSparse)
    ]);
    
    // Aggregate results
    nodeResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { created, processed } = result.value;
        nodesCreated += created;
        nodesProcessed += processed;
      } else {
        const nodeTypes = ['Concept', 'Persona', 'Offer', 'Evidence', 'Artifact'];
        warnings.push(nodeTypes[index] + ' processing failed: ' + String(result.reason));
      }
    });
    
    edgeResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        edgesCreated += result.value;
      } else {
        warnings.push('Edge processing failed: ' + String(result.reason));
      }
    });
    
    batchCount = Math.ceil(nodesProcessed / BATCH_SIZE);
    
    const duration = Date.now() - startTime;
    
    return {
      success: warnings.length === 0,
      nodesCreated,
      edgesCreated,
      flags: {
        graphSparse,
        incrementalMode: !!since,
        hasErrors: warnings.length > 0
      },
      performance: {
        duration,
        batchCount,
        nodesProcessed
      },
      nextCursor: new Date().toISOString(),
      ...(warnings.length > 0 && { warnings })
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('Mirror operation failed:', errorMessage);
    
    return {
      success: false,
      nodesCreated: 0,
      edgesCreated: 0,
      flags: {
        graphSparse,
        incrementalMode: !!since,
        hasErrors: true
      },
      performance: {
        duration,
        batchCount: 0,
        nodesProcessed: 0
      },
      nextCursor: new Date().toISOString(),
      error: errorMessage
    };
  } finally {
    // Clean up connections
    if (neo4jDriver) {
      await neo4jDriver.close();
    }
  }
}

/**
 * Initialize Neo4j driver with environment configuration
 */
async function initializeNeo4jDriver(): Promise<Driver> {
  const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'password';
  
  try {
    // Handle test environment where neo4j.auth might not be mocked
    let authToken;
    if (neo4j.auth && neo4j.auth.basic) {
      authToken = neo4j.auth.basic(neo4jUser, neo4jPassword);
    } else {
      // Test environment fallback - create a mock auth token
      authToken = { scheme: 'basic', principal: neo4jUser, credentials: neo4jPassword };
    }
    const driver = neo4j.driver(neo4jUri, authToken);
    
    // Test connection
    const session = driver.session();
    try {
      await session.run('RETURN 1');
      console.log('Neo4j connection established');
      return driver;
    } finally {
      await session.close();
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error('Neo4j connection failed: ' + errorMsg);
  }
}

/**
 * Initialize Supabase client with environment configuration
 */
function initializeSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase connection');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Process Concept nodes from eip_entities table
 */
async function processConceptNodes(
  driver: Driver, 
  supabase: SupabaseClient, 
  since?: string, 
  graphSparse?: boolean
): Promise<{ created: number; processed: number }> {
  const session = driver.session();
  let created = 0;
  let processed = 0;
  
  try {
    // Query for concept entities
    let query = supabase
      .from('eip_entities')
      .select('id, type, name, attrs, valid_from, source_url')
      .eq('type', 'concept');
    
    if (since) {
      query = query.gte('valid_from', since);
    }
    
    const { data: concepts, error } = await query.order('valid_from', { ascending: true });
    
    if (error) {
      throw new Error('Concept query failed: ' + error.message);
    }
    
    if (!concepts || concepts.length === 0) {
      return { created: 0, processed: 0 };
    }
    
    // Process in batches
    for (let i = 0; i < concepts.length; i += BATCH_SIZE) {
      const batch = concepts.slice(i, i + BATCH_SIZE);
      
      for (const concept of batch) {
        processed++;
        
        // Skip if graphSparse and no key attributes
        if (graphSparse && !concept.attrs?.category) {
          continue;
        }
        
        // Use MERGE to avoid duplicates
        const cypher = 'MERGE (c:Concept {id: $id}) SET c.name = $name, c.type = $type, c.attrs = $attrs, c.updated_at = coalesce($updated_at, datetime()), c.source_url = $source_url';
        
        await session.run(cypher, {
          id: concept.id,
          name: concept.name,
          type: concept.type,
          attrs: concept.attrs || {},
          updated_at: concept.valid_from || new Date().toISOString(),
          source_url: concept.source_url
        });
        
        created++;
      }
    }
    
    console.log('Processed ' + processed + ' Concept nodes, created ' + created);
    return { created, processed };
    
  } finally {
    await session.close();
  }
}

/**
 * Process Persona nodes from eip_entities table
 */
async function processPersonaNodes(
  driver: Driver, 
  supabase: SupabaseClient, 
  since?: string, 
  graphSparse?: boolean
): Promise<{ created: number; processed: number }> {
  const session = driver.session();
  let created = 0;
  let processed = 0;
  
  try {
    let query = supabase
      .from('eip_entities')
      .select('id, type, name, attrs, valid_from, source_url')
      .eq('type', 'persona');
    
    if (since) {
      query = query.gte('valid_from', since);
    }
    
    const { data: personas, error } = await query.order('valid_from', { ascending: true });
    
    if (error) {
      throw new Error('Persona query failed: ' + error.message);
    }
    
    if (!personas || personas.length === 0) {
      return { created: 0, processed: 0 };
    }
    
    for (let i = 0; i < personas.length; i += BATCH_SIZE) {
      const batch = personas.slice(i, i + BATCH_SIZE);
      
      for (const persona of batch) {
        processed++;
        
        // Skip if graphSparse and no key attributes
        if (graphSparse && !persona.attrs?.age_range) {
          continue;
        }
        
        const cypher = 'MERGE (p:Persona {id: $id}) SET p.name = $name, p.type = $type, p.attrs = $attrs, p.updated_at = coalesce($updated_at, datetime()), p.source_url = $source_url';
        
        await session.run(cypher, {
          id: persona.id,
          name: persona.name,
          type: persona.type,
          attrs: persona.attrs || {},
          updated_at: persona.valid_from || new Date().toISOString(),
          source_url: persona.source_url
        });
        
        created++;
      }
    }
    
    console.log('Processed ' + processed + ' Persona nodes, created ' + created);
    return { created, processed };
    
  } finally {
    await session.close();
  }
}

/**
 * Process Offer nodes from eip_entities table
 */
async function processOfferNodes(
  driver: Driver, 
  supabase: SupabaseClient, 
  since?: string, 
  graphSparse?: boolean
): Promise<{ created: number; processed: number }> {
  const session = driver.session();
  let created = 0;
  let processed = 0;
  
  try {
    let query = supabase
      .from('eip_entities')
      .select('id, type, name, attrs, valid_from, source_url')
      .eq('type', 'offer');
    
    if (since) {
      query = query.gte('valid_from', since);
    }
    
    const { data: offers, error } = await query.order('valid_from', { ascending: true });
    
    if (error) {
      throw new Error('Offer query failed: ' + error.message);
    }
    
    if (!offers || offers.length === 0) {
      return { created: 0, processed: 0 };
    }
    
    for (let i = 0; i < offers.length; i += BATCH_SIZE) {
      const batch = offers.slice(i, i + BATCH_SIZE);
      
      for (const offer of batch) {
        processed++;
        
        // Skip if graphSparse and no key attributes
        if (graphSparse && !offer.attrs?.service_type) {
          continue;
        }
        
        const cypher = 'MERGE (o:Offer {id: $id}) SET o.name = $name, o.type = $type, o.attrs = $attrs, o.updated_at = coalesce($updated_at, datetime()), o.source_url = $source_url';
        
        await session.run(cypher, {
          id: offer.id,
          name: offer.name,
          type: offer.type,
          attrs: offer.attrs || {},
          updated_at: offer.valid_from || new Date().toISOString(),
          source_url: offer.source_url
        });
        
        created++;
      }
    }
    
    console.log('Processed ' + processed + ' Offer nodes, created ' + created);
    return { created, processed };
    
  } finally {
    await session.close();
  }
}

/**
 * Process Evidence nodes from eip_evidence_snapshots table
 */
async function processEvidenceNodes(
  driver: Driver, 
  supabase: SupabaseClient, 
  since?: string, 
  graphSparse?: boolean
): Promise<{ created: number; processed: number }> {
  const session = driver.session();
  let created = 0;
  let processed = 0;
  
  try {
    let query = supabase
      .from('eip_evidence_snapshots')
      .select('id, evidence_key, version, data, last_checked');
    
    if (since) {
      query = query.gte('last_checked', since.split('T')[0]);
    }
    
    const { data: evidence, error } = await query.order('last_checked', { ascending: true });
    
    if (error) {
      throw new Error('Evidence query failed: ' + error.message);
    }
    
    if (!evidence || evidence.length === 0) {
      return { created: 0, processed: 0 };
    }
    
    for (let i = 0; i < evidence.length; i += BATCH_SIZE) {
      const batch = evidence.slice(i, i + BATCH_SIZE);
      
      for (const ev of batch) {
        processed++;
        
        // Skip if graphSparse and no key data
        if (graphSparse && !ev.data?.updated) {
          continue;
        }
        
        const cypher = 'MERGE (e:Evidence {id: $id}) SET e.evidence_key = $evidence_key, e.version = $version, e.data = $data, e.updated_at = coalesce($updated_at, datetime()), e.last_checked = $last_checked';
        
        await session.run(cypher, {
          id: ev.id,
          evidence_key: ev.evidence_key,
          version: ev.version,
          data: ev.data || {},
          updated_at: ev.last_checked || new Date().toISOString(),
          last_checked: ev.last_checked
        });
        
        created++;
      }
    }
    
    console.log('Processed ' + processed + ' Evidence nodes, created ' + created);
    return { created, processed };
    
  } finally {
    await session.close();
  }
}

/**
 * Process Artifact nodes from eip_artifacts table
 */
async function processArtifactNodes(
  driver: Driver, 
  supabase: SupabaseClient, 
  since?: string, 
  graphSparse?: boolean
): Promise<{ created: number; processed: number }> {
  const session = driver.session();
  let created = 0;
  let processed = 0;
  
  try {
    let query = supabase
      .from('eip_artifacts')
      .select('id, brief, ip_used, tier, persona, funnel, ledger, created_at, updated_at');
    
    if (since) {
      query = query.gte('updated_at', since);
    }
    
    const { data: artifacts, error } = await query.order('updated_at', { ascending: true });
    
    if (error) {
      throw new Error('Artifact query failed: ' + error.message);
    }
    
    if (!artifacts || artifacts.length === 0) {
      return { created: 0, processed: 0 };
    }
    
    for (let i = 0; i < artifacts.length; i += BATCH_SIZE) {
      const batch = artifacts.slice(i, i + BATCH_SIZE);
      
      for (const artifact of batch) {
        processed++;
        
        // Skip if graphSparse and no key attributes
        if (graphSparse && !artifact.ledger?.evidence?.length) {
          continue;
        }
        
        const cypher = 'MERGE (a:Artifact {id: $id}) SET a.brief = $brief, a.ip_used = $ip_used, a.tier = $tier, a.persona = $persona, a.funnel = $funnel, a.ledger = $ledger, a.created_at = $created_at, a.updated_at = $updated_at';
        
        await session.run(cypher, {
          id: artifact.id,
          brief: artifact.brief,
          ip_used: artifact.ip_used,
          tier: artifact.tier,
          persona: artifact.persona,
          funnel: artifact.funnel,
          ledger: artifact.ledger || {},
          created_at: artifact.created_at,
          updated_at: artifact.updated_at
        });
        
        created++;
      }
    }
    
    console.log('Processed ' + processed + ' Artifact nodes, created ' + created);
    return { created, processed };
    
  } finally {
    await session.close();
  }
}

/**
 * Process edge relationships from artifact ledger data
 */
async function processArtifactEdges(
  driver: Driver, 
  supabase: SupabaseClient, 
  since?: string, 
  graphSparse?: boolean
): Promise<number> {
  const session = driver.session();
  let edgesCreated = 0;
  
  try {
    let query = supabase
      .from('eip_artifacts')
      .select('id, ledger, updated_at');
    
    if (since) {
      query = query.gte('updated_at', since);
    }
    
    const { data: artifacts, error } = await query.order('updated_at', { ascending: true });
    
    if (error) {
      throw new Error('Artifact edge query failed: ' + error.message);
    }
    
    if (!artifacts || artifacts.length === 0) {
      return 0;
    }
    
    for (const artifact of artifacts) {
      const ledger = artifact.ledger || {};
      
      // Create SUPPORTS relationships
      if (ledger.supports && Array.isArray(ledger.supports)) {
        for (const targetId of ledger.supports) {
          const cypher = 'MATCH (a:Artifact {id: $artifactId}) MATCH (t) WHERE t.id = $targetId MERGE (a)-[:SUPPORTS]->(t)';
          
          await session.run(cypher, {
            artifactId: artifact.id,
            targetId: targetId
          });
          
          edgesCreated++;
        }
      }
      
      // Create CONTRASTS relationships
      if (ledger.contrasts && Array.isArray(ledger.contrasts)) {
        for (const targetId of ledger.contrasts) {
          const cypher = 'MATCH (a:Artifact {id: $artifactId}) MATCH (t) WHERE t.id = $targetId MERGE (a)-[:CONTRASTS]->(t)';
          
          await session.run(cypher, {
            artifactId: artifact.id,
            targetId: targetId
          });
          
          edgesCreated++;
        }
      }
      
      // Create APPLIES_TO relationships for personas
      if (ledger.applies_to && Array.isArray(ledger.applies_to)) {
        for (const personaId of ledger.applies_to) {
          const cypher = 'MATCH (a:Artifact {id: $artifactId}) MATCH (p:Persona {id: $personaId}) MERGE (a)-[:APPLIES_TO]->(p)';
          
          await session.run(cypher, {
            artifactId: artifact.id,
            personaId: personaId
          });
          
          edgesCreated++;
        }
      }
      
      // Create HAS_TAG relationships
      if (ledger.tags && Array.isArray(ledger.tags)) {
        for (const tag of ledger.tags) {
          const cypher = 'MATCH (a:Artifact {id: $artifactId}) MERGE (t:Tag {name: $tag}) MERGE (a)-[:HAS_TAG]->(t)';
          
          await session.run(cypher, {
            artifactId: artifact.id,
            tag: tag
          });
          
          edgesCreated++;
        }
      }
      
      // Create DERIVED_FROM relationships for evidence
      if (ledger.evidence && Array.isArray(ledger.evidence)) {
        for (const evidenceId of ledger.evidence) {
          const cypher = 'MATCH (a:Artifact {id: $artifactId}) MATCH (e:Evidence {id: $evidenceId}) MERGE (a)-[:DERIVED_FROM]->(e)';
          
          await session.run(cypher, {
            artifactId: artifact.id,
            evidenceId: evidenceId
          });
          
          edgesCreated++;
        }
      }
    }
    
    console.log('Created ' + edgesCreated + ' edge relationships');
    return edgesCreated;
    
  } finally {
    await session.close();
  }
}

// Legacy main function for direct script execution
async function main() {
  console.log('Mirror to Neo4j: starting complete implementation...');
  
  try {
    const result = await mirrorSupabaseToNeo4j();
    console.log('Mirror operation completed:', {
      success: result.success,
      nodesCreated: result.nodesCreated,
      edgesCreated: result.edgesCreated,
      duration: result.performance.duration + 'ms',
      warnings: result.warnings?.length || 0
    });
    
    if (!result.success) {
      console.error('Operation failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Mirror failed:', error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (require.main === module) {
  main();
}
