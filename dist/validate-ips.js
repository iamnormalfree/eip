"use strict";
// ABOUTME: Enhanced IP validator (Comprehensive Zod Validation)
// ABOUTME: Validates IP structure with runtime type checking and detailed diagnostics
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const yaml_1 = require("yaml");
// Import schema validation (will be created if doesn't exist)
let ipSchemaRegistry;
try {
    const schemaModule = require('../ip-validation/schemas');
    ipSchemaRegistry = schemaModule.ipSchemaRegistry;
}
catch (error) {
    console.warn('⚠️  Schema registry not found, using basic validation');
}
function validateIPBasic(obj, file) {
    const errors = [];
    const warnings = [];
    // Basic required fields
    const required = ['id', 'version', 'purpose', 'operators', 'invariants', 'sections'];
    for (const key of required) {
        if (!(key in obj)) {
            errors.push(`Missing required field: ${key}`);
        }
    }
    // Field type validation
    if (obj.operators && !Array.isArray(obj.operators)) {
        errors.push('operators must be an array');
    }
    if (obj.invariants && !Array.isArray(obj.invariants)) {
        errors.push('invariants must be an array');
    }
    if (obj.sections && !Array.isArray(obj.sections)) {
        errors.push('sections must be an array');
    }
    // Version format validation
    if (obj.version && !/^\d+\.\d+\.\d+$/.test(obj.version)) {
        errors.push('Version must be in semver format (x.y.z)');
    }
    // ID format validation
    if (obj.id && !/^[a-z][a-z0-9_]*$/.test(obj.id)) {
        errors.push('ID must be lowercase snake_case');
    }
    // Content quality warnings
    if (obj.purpose && obj.purpose.length < 10) {
        warnings.push('Purpose description is very short');
    }
    if (obj.operators && Array.isArray(obj.operators) && obj.operators.length === 0) {
        warnings.push('No operators defined');
    }
    if (obj.invariants && Array.isArray(obj.invariants) && obj.invariants.length === 0) {
        warnings.push('No invariants defined');
    }
    if (obj.sections && Array.isArray(obj.sections) && obj.sections.length < 2) {
        warnings.push('Very few sections defined');
    }
    return {
        file,
        valid: errors.length === 0,
        errors,
        warnings,
        ipType: obj.id || 'unknown',
        version: obj.version || 'unknown'
    };
}
function validateIPWithSchema(obj, file) {
    if (!ipSchemaRegistry) {
        return validateIPBasic(obj, file);
    }
    try {
        const result = ipSchemaRegistry.validate(obj);
        return {
            file,
            valid: result.valid,
            errors: result.errors,
            warnings: result.warnings,
            ipType: result.ipType,
            version: result.version
        };
    }
    catch (error) {
        return {
            file,
            valid: false,
            errors: [`Schema validation failed: ${error}`],
            warnings: [],
            ipType: obj.id || 'unknown',
            version: obj.version || 'unknown'
        };
    }
}
function validateIPFile(filePath) {
    try {
        const raw = node_fs_1.default.readFileSync(filePath, 'utf8');
        const obj = (0, yaml_1.parse)(raw);
        return validateIPWithSchema(obj, node_path_1.default.basename(filePath));
    }
    catch (error) {
        return {
            file: node_path_1.default.basename(filePath),
            valid: false,
            errors: [`Failed to parse YAML: ${error}`],
            warnings: [],
            ipType: 'unknown',
            version: 'unknown'
        };
    }
}
function analyzeIPStructure(ipDir, files) {
    console.log('\n📊 IP Library Analysis:');
    const ipTypes = new Map();
    const versions = new Map();
    const sections = new Set();
    for (const file of files) {
        try {
            const filePath = node_path_1.default.join(ipDir, file);
            const raw = node_fs_1.default.readFileSync(filePath, 'utf8');
            const obj = (0, yaml_1.parse)(raw);
            // Count IP types
            const ipType = obj.id || 'unknown';
            ipTypes.set(ipType, (ipTypes.get(ipType) || 0) + 1);
            // Track versions
            if (obj.version) {
                if (!versions.has(ipType)) {
                    versions.set(ipType, []);
                }
                versions.get(ipType).push(obj.version);
            }
            // Collect sections
            if (obj.sections && Array.isArray(obj.sections)) {
                obj.sections.forEach((section) => sections.add(section));
            }
        }
        catch (error) {
            // Skip invalid files in analysis
        }
    }
    console.log(`\n📈 IP Types (${ipTypes.size}):`);
    ipTypes.forEach((count, type) => {
        console.log(`   ${type}: ${count} file(s)`);
    });
    console.log(`\n📋 Versions:`);
    versions.forEach((versionList, type) => {
        console.log(`   ${type}: ${versionList.join(', ')}`);
    });
    console.log(`\n📝 All Sections (${sections.size}):`);
    Array.from(sections).sort().forEach(section => {
        console.log(`   - ${section}`);
    });
}
function main() {
    const dir = node_path_1.default.join(process.cwd(), 'ip_library');
    if (!node_fs_1.default.existsSync(dir)) {
        console.log('ip_library directory not found; nothing to validate');
        process.exit(0);
    }
    const files = node_fs_1.default.readdirSync(dir).filter((f) => f.endsWith('.yaml'));
    if (files.length === 0) {
        console.log('No IP YAML files found; nothing to validate');
        process.exit(0);
    }
    console.log(`🔍 Validating ${files.length} IP file(s)...`);
    const reports = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let validCount = 0;
    for (const file of files) {
        const filePath = node_path_1.default.join(dir, file);
        const report = validateIPFile(filePath);
        reports.push(report);
        if (report.valid) {
            validCount++;
            console.log(`✅ ${file}: Valid (${report.ipType} v${report.version})`);
        }
        else {
            console.log(`❌ ${file}: Invalid (${report.errors.length} errors, ${report.warnings.length} warnings)`);
        }
        totalErrors += report.errors.length;
        totalWarnings += report.warnings.length;
        // Show detailed errors for invalid files
        if (report.errors.length > 0) {
            report.errors.forEach(error => {
                console.log(`   🔴 ${error}`);
            });
        }
        // Show warnings
        if (report.warnings.length > 0) {
            report.warnings.forEach(warning => {
                console.log(`   🟡 ${warning}`);
            });
        }
    }
    console.log(`\n📋 Validation Summary:`);
    console.log(`   Total files: ${files.length}`);
    console.log(`   Valid: ${validCount}`);
    console.log(`   Invalid: ${files.length - validCount}`);
    console.log(`   Total errors: ${totalErrors}`);
    console.log(`   Total warnings: ${totalWarnings}`);
    // Analyze structure if we have valid IPs
    if (validCount > 0) {
        analyzeIPStructure(dir, files);
    }
    // Show supported types if schema registry is available
    if (ipSchemaRegistry) {
        console.log(`\n🔧 Supported IP Types:`);
        const supportedTypes = ipSchemaRegistry.getSupportedTypes();
        if (supportedTypes.length > 0) {
            supportedTypes.forEach((type) => {
                const schema = ipSchemaRegistry.get(type);
                console.log(`   - ${type}: ${schema?.description || 'No description'}`);
            });
        }
        else {
            console.log('   No IP types registered');
        }
    }
    // Exit with error code if any validation failed
    if (totalErrors > 0) {
        console.log('\n❌ Validation failed with errors');
        process.exit(1);
    }
    else {
        console.log('\n✅ All validations passed');
        process.exit(0);
    }
}
main();
