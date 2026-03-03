/**
 * Process Tag nodes as first-class entities with proper ingestion from authoritative sources
 * Tags are processed from eip_entities where type = 'tag' with fallback to ledger.tags extraction
 */
async function processTagNodesTest(session: Session | null, supabase: SupabaseClient, since?: string, graphSparse?: boolean) {
  let created = 0;
  let processed = 0;
  const collectedTags = new Set<string>();
  
  try {
    // Primary source: Process Tags from eip_entities where type = 'tag'
    let tagEntityQuery = supabase
      .from('eip_entities')
      .select('id, type, name, attrs, valid_from, source_url')
      .eq('type', 'tag');
    
    if (since) {
      // @ts-ignore - test environment mock
      tagEntityQuery = tagEntityQuery.gte('valid_from', since);
    }
    
    // @ts-ignore - test environment mock
    const { data: tagEntities, error: tagEntityError } = await tagEntityQuery.order('valid_from', { ascending: true });
    
    if (tagEntityError) {
      console.warn('Tag entity query failed:', tagEntityError.message);
    } else if (tagEntities && tagEntities.length > 0) {
      // Process authoritative Tag entities
      for (const tagEntity of tagEntities) {
        processed++;
        collectedTags.add(tagEntity.name);
        
        if (session) {
          const cypher = 'MERGE (t:Tag {id: $id}) SET t.name = $name, t.type = $type, t.attrs = $attrs, t.updated_at = coalesce($updated_at, datetime()), t.source_url = $source_url';
          
          await session.run(cypher, {
            id: tagEntity.id,
            name: tagEntity.name,
            type: tagEntity.type,
            attrs: tagEntity.attrs || {},
            updated_at: tagEntity.valid_from || new Date().toISOString(),
            source_url: tagEntity.source_url
          });
        }
        
        created++;
      }
    }
    
    // Fallback: Extract and process tags from artifact ledgers
    // This ensures backward compatibility and captures tags not yet in eip_entities
    let artifactQuery = supabase
      .from('eip_artifacts')
      .select('id, ledger, updated_at');
    
    if (since) {
      // @ts-ignore - test environment mock
      artifactQuery = artifactQuery.gte('updated_at', since);
    }
    
    // @ts-ignore - test environment mock
    const { data: artifacts, error: artifactError } = await artifactQuery.order('updated_at', { ascending: true });
    
    if (artifactError) {
      throw new Error('Artifact tag extraction query failed: ' + artifactError.message);
    }
    
    if (artifacts && artifacts.length > 0) {
      for (const artifact of artifacts) {
        const ledger = artifact.ledger || {};
        
        if (ledger.tags && Array.isArray(ledger.tags)) {
          for (const tagName of ledger.tags) {
            if (!collectedTags.has(tagName)) {
              processed++;
              collectedTags.add(tagName);
              
              if (session) {
                // Create Tag node with minimal properties for fallback tags
                const normalizedTagId = 'tag-' + tagName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const cypher = 'MERGE (t:Tag {id: $id}) SET t.name = $name, t.type = $type, t.attrs = $attrs, t.updated_at = coalesce($updated_at, datetime())';
                
                await session.run(cypher, {
                  id: normalizedTagId,
                  name: tagName,
                  type: 'tag',
                  attrs: { source: 'ledger_fallback', artifact_id: artifact.id },
                  updated_at: artifact.updated_at || new Date().toISOString()
                });
              }
              
              created++;
            }
          }
        }
      }
    }
    
    console.log('Processed ' + processed + ' Tag nodes, created ' + created);
    return { created, processed };
    
  } catch (error) {
    console.error('Error processing Tag nodes:', error);
    return { created: 0, processed: 0 };
  }
}
