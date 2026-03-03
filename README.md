# EIP - Educational-IP Content Runtime

AI-powered content generation framework with compliance control and human-in-the-loop quality gates.

## Status

**Workflow-ready for Fear-on-Paper production**

## Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Run tests
npm run test:smoke
npm run test:integration
```

## Architecture

```
Brief → Retrieval → Generation → HITL Gates → Publish
                  ↓
            Compliance + Audit
```

## Run Modes

### Direct Mode (Local Dev)
```bash
npm run orchestrator:start
```

### Queue Mode (Production)
```bash
EIP_QUEUE_STRICT=true npm run orchestrator:start -- --queue
```

## Environment Variables

See `.env.example` for required variables:
- `REDIS_URL` - Queue backend
- `NEXT_PUBLIC_SUPABASE_URL` - Content persistence
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access
- `EIP_QUEUE_STRICT=true` - Fail-fast in production

## Templates

- `templates/fear-on-paper-script.yaml` - Long-form video
- `templates/fear-on-paper-shorts.yaml` - 60-sec video
- `templates/fear-on-paper-email.yaml` - Email newsletter
- `templates/fear-on-paper-cta-safe.yaml` - Educational CTA

## IP Profiles

- `ip_library/framework@1.0.0.yaml`
- `ip_library/imv2_framework@1.0.0.yaml` - FoP
- `ip_library/imv2_loop_debug@1.0.0.yaml`
- `ip_library/imv2_founder_translation@1.0.0.yaml`

## Promotion Checklist

- [x] `npm run test:smoke` passes
- [x] `npm run test:integration` passes
- [x] `npm run test:compliance` passes
- [x] `npm run ip:validate` passes
- [x] Queue strict mode verified
- [x] Templates pass IM conformance

## Docs

- [Runbooks](./docs/runbooks/active/)
- [Plans](./docs/plans/active/)
- [PRD](./docs/eip/prd.md)
