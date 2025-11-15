"use strict";
// ABOUTME: BM25 Index Builder for EIP Retrieval Enhancement
// ABOUTME: Phase 1 implementation of unified blueprint for retrieval stack
Object.defineProperty(exports, "__esModule", { value: true });
exports.BM25IndexBuilder = void 0;
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config({ path: '.env.local' });
/**
 * Validate semantic versioning format (major.minor.patch)
 */
function validateSemanticVersion(version) {
    const semanticVersionRegex = /^\d+\.\d+\.\d+$/;
    return semanticVersionRegex.test(version);
}
class BM25IndexBuilder {
    /**
     * Create a new BM25IndexBuilder instance
     * @param version Optional version string in semantic versioning format (e.g., "1.0.0", "1.1.0", "1.2.0")
     *                 Defaults to "1.0.0" for backward compatibility
     * @throws Error if version is provided but doesn't follow semantic versioning format
     */
    constructor(version) {
        this.k1 = 1.2;
        this.b = 0.75;
        this.fieldWeights = {
            'concept_abstract': 2.0,
            'artifact_summary': 1.0,
            'entity_name': 1.5,
            'content': 1.0
        };
        // Set version with default for backward compatibility
        this.version = version || '1.0.0';
        // Validate version format
        if (!validateSemanticVersion(this.version)) {
            throw new Error(`Invalid version format: "${this.version}". Version must follow semantic versioning format (e.g., "1.0.0", "1.1.0", "1.2.0")`);
        }
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing required environment variables for database connection');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    /**
     * Get the current version of this BM25IndexBuilder instance
     */
    getVersion() {
        return this.version;
    }
    /**
     * Build BM25 index from Supabase data sources
     */
    async buildIndex(sources, parentVersion) {
        const startTime = Date.now();
        try {
            console.log('Building BM25 index version ' + this.version + ' from ' + sources.length + ' sources...');
            // Process and tokenize documents
            const processedDocs = this.processDocuments(sources);
            // Create index data structure
            const indexData = {
                version: this.version,
                build_timestamp: new Date().toISOString(),
                document_count: processedDocs.length,
                field_weights: this.fieldWeights,
                documents: processedDocs,
                doc_stats: {
                    avg_doc_length: this.calculateAverageDocLength(processedDocs),
                    total_docs: processedDocs.length,
                    k1: this.k1,
                    b: this.b
                }
            };
            // Generate checksum
            const checksum = this.calculateChecksum(indexData);
            // Create index directory structure
            const indexDir = await this.createIndexDirectory(this.version);
            const indexPath = path.join(indexDir, this.version + '-index.json');
            const checksumPath = path.join(indexDir, this.version + '-checksum.txt');
            // Write index atomically
            await this.writeIndexAtomically(indexPath, indexData);
            // Write checksum file
            await fs.promises.writeFile(checksumPath, checksum, 'utf8');
            // Create latest symlink
            const latestPath = path.join(path.dirname(indexDir), 'latest.json');
            await this.createSymlink(indexPath, latestPath);
            // Create schema registry entry
            // Create schema registry entry with complete audit trail
            const buildTime = Date.now() - startTime;
            const indexStats = await fs.promises.stat(indexPath);
            const indexSizeBytes = indexStats.size;
            const buildMetadata = {
                build_type: parentVersion ? 'incremental' : 'full',
                builder_version: this.version,
                environment: process.env.NODE_ENV || 'development',
                build_timestamp: new Date().toISOString()
            };
            const schemaEntry = {
                id: 'bm25_' + this.version + '_' + Date.now(),
                index_type: 'bm25_file',
                version: this.version,
                checksum,
                created_at: new Date().toISOString(),
                document_sources: sources.map(s => s.id),
                field_weights: this.fieldWeights,
                build_metadata: buildMetadata,
                index_size_bytes: indexSizeBytes,
                document_count: processedDocs.length,
                build_duration_ms: buildTime,
                is_active: true,
                parent_version: parentVersion || null
            };
            // Register in database
            await this.registerIndexInSchema(schemaEntry);
            console.log('BM25 index v' + this.version + ' built successfully:');
            console.log('   - Documents: ' + processedDocs.length);
            console.log('   - Index path: ' + indexPath);
            console.log('   - Checksum: ' + checksum.substring(0, 16) + '...');
            console.log('   - Build time: ' + buildTime + 'ms');
            return {
                success: true,
                index_path: indexPath,
                version: this.version,
                checksum,
                document_count: processedDocs.length,
                build_time_ms: buildTime,
                schema_registry_entry: schemaEntry
            };
        }
        catch (error) {
            const buildTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('BM25 index build failed:', errorMessage);
            return {
                success: false,
                index_path: '',
                version: this.version,
                checksum: '',
                document_count: 0,
                build_time_ms: buildTime,
                schema_registry_entry: {},
                error: errorMessage
            };
        }
    }
    /**
     * Load existing BM25 index from file
     */
    async loadIndex(indexPath) {
        try {
            if (!fs.existsSync(indexPath)) {
                throw new Error('Index file not found: ' + indexPath);
            }
            console.log('Loading BM25 index from ' + indexPath + '...');
            const indexContent = await fs.promises.readFile(indexPath, 'utf8');
            const indexData = JSON.parse(indexContent);
            // Validate index structure
            this.validateIndexStructure(indexData);
            // Verify checksum if available
            const checksumPath = indexPath.replace('-index.json', '-checksum.txt');
            if (fs.existsSync(checksumPath)) {
                const expectedChecksum = await fs.promises.readFile(checksumPath, 'utf8');
                const actualChecksum = this.calculateChecksum(indexData);
                if (expectedChecksum.trim() !== actualChecksum) {
                    throw new Error('Index corruption detected: checksum mismatch');
                }
                console.log('Index checksum verified: ' + actualChecksum.substring(0, 16) + '...');
            }
            console.log('Loaded BM25 index v' + indexData.version + ' with ' + indexData.document_count + ' documents');
            return indexData;
        }
        catch (error) {
            console.error('Failed to load BM25 index:', error);
            throw error;
        }
    }
    /**
     * Validate checksum of existing index
     */
    validateChecksum(indexPath, expectedChecksum) {
        try {
            if (!fs.existsSync(indexPath)) {
                console.error('Index file not found: ' + indexPath);
                return false;
            }
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            const indexData = JSON.parse(indexContent);
            const actualChecksum = this.calculateChecksum(indexData);
            const isValid = expectedChecksum.trim() === actualChecksum;
            if (isValid) {
                console.log('Checksum validation passed: ' + actualChecksum.substring(0, 16) + '...');
            }
            else {
                console.error('Checksum validation failed:');
                console.error('   Expected: ' + expectedChecksum.substring(0, 16) + '...');
                console.error('   Actual:   ' + actualChecksum.substring(0, 16) + '...');
            }
            return isValid;
        }
        catch (error) {
            console.error('Checksum validation error:', error);
            return false;
        }
    }
    /**
     * Fetch document sources from Supabase
     */
    async fetchSourcesFromSupabase(limit = 1000) {
        try {
            console.log('Fetching up to ' + limit + ' document sources from Supabase...');
            const sources = [];
            // Fetch from eip_entities table
            const { data: entities, error: entitiesError } = await this.supabase
                .from('eip_entities')
                .select('id, type, name, attrs, source_url, valid_from')
                .limit(limit / 2)
                .order('valid_from', { ascending: false });
            if (!entitiesError && entities) {
                for (const entity of entities) {
                    // Extract concept_abstract from entity.attrs
                    let conceptAbstract = '';
                    if (entity.attrs) {
                        try {
                            const attrs = typeof entity.attrs === 'string'
                                ? JSON.parse(entity.attrs)
                                : entity.attrs;
                            conceptAbstract = attrs.concept_abstract || '';
                        }
                        catch {
                            conceptAbstract = '';
                        }
                    }
                    sources.push({
                        id: 'entity_' + entity.id,
                        fields: {
                            concept_abstract: conceptAbstract,
                            entity_name: entity.name || '',
                            content: this.combineEntityContent(entity) // Fallback
                        },
                        metadata: {
                            type: 'entity',
                            entity_type: entity.type,
                            name: entity.name,
                            attrs: entity.attrs
                        },
                        source_url: entity.source_url,
                        last_updated: entity.valid_from
                    });
                }
                console.log('   - Fetched ' + entities.length + ' entities');
            }
            // Fetch from eip_artifacts table
            const { data: artifacts, error: artifactsError } = await this.supabase
                .from('eip_artifacts')
                .select('id, type, title, summary, content, created_at')
                .limit(limit / 2)
                .order('created_at', { ascending: false });
            if (!artifactsError && artifacts) {
                for (const artifact of artifacts) {
                    sources.push({
                        id: 'artifact_' + artifact.id,
                        fields: {
                            artifact_summary: artifact.summary || '',
                            content: artifact.content || ''
                        },
                        metadata: {
                            type: 'artifact',
                            artifact_type: artifact.type,
                            title: artifact.title
                        },
                        last_updated: artifact.created_at
                    });
                }
                console.log('   - Fetched ' + artifacts.length + ' artifacts');
            }
            console.log('Total sources fetched: ' + sources.length);
            return sources;
        }
        catch (error) {
            console.error('Failed to fetch sources from Supabase:', error);
            throw error;
        }
    }
    /**
     * Process and tokenize documents for BM25
     */
    processDocuments(sources) {
        console.log('Processing ' + sources.length + ' documents with field weighting...');
        return sources.map(source => ({
            id: source.id,
            fields: source.fields,
            field_terms: {
                concept_abstract: source.fields.concept_abstract ? this.tokenize(source.fields.concept_abstract) : undefined,
                artifact_summary: source.fields.artifact_summary ? this.tokenize(source.fields.artifact_summary) : undefined,
                entity_name: source.fields.entity_name ? this.tokenize(source.fields.entity_name) : undefined,
                content: source.fields.content ? this.tokenize(source.fields.content) : undefined
            },
            metadata: source.metadata
        }));
    }
    /**
     * Tokenize text into terms
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 2);
    }
    /**
     * Combine entity attributes into searchable content
     */
    combineEntityContent(entity) {
        const parts = [entity.name, entity.type];
        if (entity.attrs) {
            try {
                const attrs = typeof entity.attrs === 'string'
                    ? JSON.parse(entity.attrs)
                    : entity.attrs;
                // Extract key values from attributes
                Object.values(attrs).forEach(value => {
                    if (typeof value === 'string') {
                        parts.push(value);
                    }
                    else if (Array.isArray(value)) {
                        parts.push(...value.filter(v => typeof v === 'string'));
                    }
                });
            }
            catch {
                // If JSON parsing fails, skip attributes
            }
        }
        return parts.join(' ');
    }
    /**
     * Calculate average document length
     */
    calculateAverageDocLength(documents) {
        if (documents.length === 0)
            return 0;
        const totalLength = documents.reduce((sum, doc) => {
            const allTerms = [
                ...(doc.field_terms.concept_abstract || []),
                ...(doc.field_terms.artifact_summary || []),
                ...(doc.field_terms.entity_name || []),
                ...(doc.field_terms.content || [])
            ];
            return sum + allTerms.length;
        }, 0);
        return totalLength / documents.length;
    }
    /**
     * Calculate SHA-256 checksum of index data
     */
    calculateChecksum(indexData) {
        const normalizedData = JSON.stringify(indexData, null, 2);
        return crypto.createHash('sha256').update(normalizedData).digest('hex');
    }
    /**
     * Create index directory structure
     */
    async createIndexDirectory(version) {
        const baseDir = path.join(process.cwd(), 'tmp', 'bm25-indexes');
        const versionDir = path.join(baseDir, 'v' + version);
        // Create directories if they don't exist
        await fs.promises.mkdir(baseDir, { recursive: true });
        await fs.promises.mkdir(versionDir, { recursive: true });
        return versionDir;
    }
    /**
     * Write index file atomically to prevent corruption
     */
    async writeIndexAtomically(filePath, indexData) {
        const timestamp = Date.now();
        const tempPath = filePath + '.tmp.' + timestamp;
        const backupPath = filePath + '.backup';
        try {
            // Create backup if original exists
            if (fs.existsSync(filePath)) {
                await fs.promises.copyFile(filePath, backupPath);
            }
            // Write to temporary file
            const jsonString = JSON.stringify(indexData, null, 2);
            await fs.promises.writeFile(tempPath, jsonString, 'utf8');
            // Verify the written file
            // Verify the written file content length as basic verification
            const verification = await fs.promises.readFile(tempPath, 'utf8');
            if (verification.length !== jsonString.length) {
                throw new Error('File verification failed after write: length mismatch');
            }
            // Atomic move
            await fs.promises.rename(tempPath, filePath);
            // Remove backup on success
            if (fs.existsSync(backupPath)) {
                await fs.promises.unlink(backupPath);
            }
            console.log('Index written atomically to ' + filePath);
        }
        catch (error) {
            // Cleanup on failure
            if (fs.existsSync(tempPath)) {
                await fs.promises.unlink(tempPath).catch(() => { });
            }
            // Restore backup if available
            if (fs.existsSync(backupPath) && !fs.existsSync(filePath)) {
                await fs.promises.rename(backupPath, filePath).catch(() => { });
            }
            throw error;
        }
    }
    /**
     * Create symlink for latest version
     */
    async createSymlink(target, linkPath) {
        try {
            // Remove existing symlink
            if (fs.existsSync(linkPath)) {
                await fs.promises.unlink(linkPath);
            }
            // Create new symlink
            await fs.promises.symlink(target, linkPath);
            console.log('Created symlink: ' + linkPath + ' -> ' + target);
        }
        catch (error) {
            console.warn('Failed to create symlink:', error);
            // Non-critical error, continue
        }
    }
    /**
     * Register index in schema registry
     */
    async registerIndexInSchema(entry) {
        try {
            // Use database function for transaction consistency
            const { error } = await this.supabase.rpc('register_bm25_index_version', {
                p_version: entry.version,
                p_checksum: entry.checksum,
                p_document_sources: entry.document_sources,
                p_field_weights: entry.field_weights,
                p_build_metadata: entry.build_metadata || {},
                p_index_size_bytes: entry.index_size_bytes || 0,
                p_document_count: entry.document_count || 0,
                p_build_duration_ms: entry.build_duration_ms || 0,
                p_parent_version: entry.parent_version || null
            });
            if (error) {
                throw error;
            }
            console.log('Successfully registered BM25 index with complete audit trail: ' + entry.version);
        }
        catch (error) {
            console.warn('Failed to register index in schema registry:', error);
            // Non-critical error for index creation
        }
    }
    /**
     * Validate index structure
     */
    validateIndexStructure(indexData) {
        const requiredFields = ['version', 'build_timestamp', 'document_count', 'documents', 'doc_stats'];
        for (const field of requiredFields) {
            if (!(field in indexData)) {
                throw new Error('Invalid index structure: missing field \'' + field + '\'');
            }
        }
        if (!Array.isArray(indexData.documents)) {
            throw new Error('Invalid index structure: documents must be an array');
        }
        if (typeof indexData.doc_stats !== 'object') {
            throw new Error('Invalid index structure: doc_stats must be an object');
        }
    }
}
exports.BM25IndexBuilder = BM25IndexBuilder;
// Command Line Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    try {
        // Parse version from command line arguments
        let version;
        let buildCommandIndex = 1;
        if (command === 'build' && args.length > 1) {
            // Check if the second argument is a version (semantic versioning format)
            const potentialVersion = args[1];
            if (validateSemanticVersion(potentialVersion)) {
                version = potentialVersion;
                buildCommandIndex = 2; // Shift index for other arguments
            }
        }
        const builder = new BM25IndexBuilder(version);
        switch (command) {
            case 'build': {
                console.log('Building BM25 index v' + builder.getVersion() + ' from Supabase sources...');
                const sources = await builder.fetchSourcesFromSupabase(1000);
                const result = await builder.buildIndex(sources);
                if (result.success) {
                    console.log('\nIndex build completed successfully!');
                    console.log('Index location: ' + result.index_path);
                    console.log('Documents indexed: ' + result.document_count);
                    console.log('Build time: ' + result.build_time_ms + 'ms');
                }
                else {
                    console.error('\nIndex build failed:', result.error);
                    process.exit(1);
                }
                break;
            }
            case 'load': {
                const indexPath = args[buildCommandIndex];
                if (!indexPath) {
                    console.error('Please provide index path: load <path-to-index>');
                    process.exit(1);
                }
                console.log('Loading index from ' + indexPath + '...');
                const index = await builder.loadIndex(indexPath);
                console.log('Loaded index v' + index.version + ' with ' + index.document_count + ' documents');
                break;
            }
            case 'verify': {
                const indexPath = args[buildCommandIndex];
                const checksum = args[buildCommandIndex + 1];
                if (!indexPath || !checksum) {
                    console.error('Please provide index path and checksum: verify <path-to-index> <checksum>');
                    process.exit(1);
                }
                const isValid = builder.validateChecksum(indexPath, checksum);
                console.log(isValid ? 'Checksum valid' : 'Checksum invalid');
                process.exit(isValid ? 0 : 1);
                break;
            }
            default:
                console.log('BM25 Index Builder - Phase 1 Implementation');
                console.log('');
                console.log('Usage:');
                console.log('  node build-bm25.js build [version]       # Build index from Supabase with optional version');
                console.log('  node build-bm25.js load <path>          # Load existing index');
                console.log('  node build-bm25.js verify <path> <hash> # Verify index checksum');
                console.log('');
                console.log('Examples:');
                console.log('  node build-bm25.js build                # Build index with default version 1.0.0');
                console.log('  node build-bm25.js build 1.1.0          # Build index with version 1.1.0');
                console.log('  node build-bm25.js build 1.2.0          # Build index with version 1.2.0');
                console.log('  node build-bm25.js load ./tmp/bm25-indexes/v1.0.0-index.json');
                console.log('  node build-bm25.js verify ./tmp/bm25-indexes/v1.0.0-index.json abc123...');
                break;
        }
    }
    catch (error) {
        console.error('Command failed:', error);
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    main();
}
