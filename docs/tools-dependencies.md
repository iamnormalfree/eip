# ABOUTME: Documentation for Plan 07 Compliance and Evidence Registry dependencies
# PURPOSE: Explains reasoning behind selected dependencies for compliance validation system

## Plan 07 Dependencies - Compliance and Evidence Registry

This document explains the reasoning for each dependency added to support Plan 07's queue-based compliance processing and evidence registry functionality.

### Production Dependencies

#### `validator: ^13.11.0`
**Purpose:** String validation and sanitization for compliance data
**Why needed:**
- Validates email addresses, URLs, and other structured compliance fields
- Sanitizes user inputs to prevent injection attacks in evidence metadata
- Provides standardized validation patterns for Singapore compliance requirements
- Lightweight, no dependencies, battle-tested library
- EIP Quality Gate: Ensures compliance data integrity at ingestion

#### `link-check: ^5.2.0`
**Purpose:** Automated URL validation for evidence source links
**Why needed:**
- Validates that evidence source URLs are accessible and return correct status codes
- Checks for broken links in compliance evidence chains
- Supports HTTP/HTTPS validation for MAS, IRAS, .gov, .edu domains
- Asynchronous processing to maintain publisher performance
- EIP Compliance Rule: Only allow-list domains as evidence sources

#### `node-cron: ^3.0.3`
**Purpose:** Scheduled compliance processing and evidence refresh
**Why needed:**
- Implements periodic compliance validation jobs for queue-based processing
- Schedules evidence link revalidation to ensure ongoing compliance
- Supports cron-based cleanup of expired compliance records
- Non-blocking scheduling to maintain orchestrator performance
- EIP Performance Budget: Offloads compliance work to background jobs

#### `jsonschema: ^1.4.1`
**Purpose:** Schema validation for compliance and evidence data structures
**Why needed:**
- Validates compliance report structure against defined schemas
- Ensures evidence registry entries follow required format
- Provides detailed validation errors for compliance debugging
- Supports draft-07 JSON Schema specification
- EIP IP Invariants: Enforces structure compliance for generated content

### Development Dependencies

#### `@types/validator: ^13.11.7`
**Purpose:** TypeScript definitions for validator library
**Why needed:**
- Provides type safety for validation operations
- Enables compile-time checking of validator usage
- Supports EIP coding standards with TypeScript
- Essential for maintaining code quality in compliance system

#### `@types/node-cron: ^3.0.11`
**Purpose:** TypeScript definitions for node-cron library
**Why needed:**
- Type safety for scheduled job configurations
- Prevents runtime errors in cron schedule definitions
- Supports EIP development workflow with TypeScript
- Ensures reliability of compliance processing schedules

## Integration with EIP Quality Framework

### Quality Gates Support
- **IP Invariant Gate:** jsonschema validates content structure compliance
- **Compliance Gate:** validator + link-check ensure regulatory requirements
- **Performance Gate:** node-cron enables queue-based background processing
- **Integration Gate:** All dependencies work together for end-to-end validation

### Queue-Based Processing Architecture
These dependencies support the LCL_EXPORT_CRITICAL decision to use queue-based compliance processing:
- `node-cron`: Schedules background compliance jobs
- `link-check`: Async URL validation prevents blocking
- `validator`: Fast input validation for queue ingestion
- `jsonschema`: Structure validation for compliance data

### Singapore-Specific Compliance
Dependencies support LCL_EXPORT_CASUAL Singapore compliance requirements:
- `validator`: Validates Singapore-specific data formats (NRIC, business codes)
- `link-check`: Validates MAS, IRAS, .gov.sg domain accessibility
- `jsonschema`: Enforces Singapore compliance report schemas
- Architecture supports domain expansion for future compliance requirements

## Performance Considerations

- All dependencies are lightweight with minimal memory footprint
- Async operations prevent blocking the main content generation pipeline
- Queue-based approach maintains publisher performance budgets
- Validation failures are isolated and don't affect core functionality

## Version Selection Rationale

Versions chosen balance stability, security, and compatibility:
- Production-ready versions with active maintenance
- Compatible with Node.js 18.17.0+ (EIP engine requirement)
- No breaking changes expected in current development cycle
- Security patches and bug fixes included in selected versions