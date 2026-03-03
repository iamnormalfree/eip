# IM v2 & Fear on Paper Content Generation

**Purpose**: Runbook for generating IM v2 internal methodology content and Fear on Paper marketing content

## Entrypoints

### Development Server (Operator UI)
```bash
npm run dev
```
Access at http://localhost:3002

### Orchestrator (Direct)
```bash
npm run orchestrator:start
```

### Orchestrator (Queue Mode)
```bash
npm run orchestrator:start -- --queue
```

### Health & Metrics Endpoints
- `GET /api/health` - System health check
- `GET /api/metrics` - Performance metrics

## IM v2 IP Profiles

Three new Internal Methodology IPs added:

| IP ID | Name | Use Case |
|-------|------|----------|
| `imv2_framework@1.0.0` | IM v2 Framework | Internal team methodologies |
| `imv2_loop_debug@1.0.0` | IM v2 Loop Debug | Troubleshooting guides |
| `imv2_founder_translation@1.0.0` | IM v2 Founder Translation | Strategy communication |

### Usage Example
```typescript
const result = await routeToIP({
  persona: 'professional',
  funnel: 'mofu',
  brief: 'internal methodology for sprint planning'
});
// Returns: imv2_framework@1.0.0
```

## Fear on Paper Templates

Four new output templates in `templates/`:

| Template | Type | Use |
|----------|------|-----|
| `fear-on-paper-script.yaml` | Script | Long-form video scripts |
| `fear-on-paper-shorts.yaml` | Shorts | Short-form video (YT Shorts, TikTok) |
| `fear-on-paper-email.yaml` | Email | Email marketing sequences |
| `fear-on-paper-cta-safe.yaml` | CTA | Compliant call-to-action |

## HITL Gates

Human-in-the-loop gating implemented in `orchestrator/hitl-gates.ts`.

### Gate Logic
Artifacts are flagged for human review when:
- Any error-level quality tag is present
- Severity score > 5 (error=3, warning=1)
- Any invariant failure is present
- Overall quality score < 60
- Compliance score < 70
- Financial claims detected

### Integration
```typescript
import { evaluateHitlGates } from './hitl-gates';

const decision = evaluateHitlGates(auditResult);
// decision.needs_human_review: boolean
// decision.review_reasons: string[]
```

## Queue Mode

Enable async processing with:
```bash
# Set environment variable
EIP_QUEUE_MODE=enabled

# Or set in .env.local
REDIS_URL=redis://localhost:6379
EIP_QUEUE_MODE=enabled
```

## Testing

```bash
# Run specific test suites
npm run test:smoke
npm run test:orchestrator
npm run test:retrieval
npm run test:auditor
npm run test:compliance

# Validate IP schemas
npm run ip:validate
```

## References

- EIP PRD: `docs/eip/prd.md`
- Big Picture: `docs/eip/big-picture.md`
- Quality Framework: `docs/EIP_FRACTAL_ALIGNMENT.md`
