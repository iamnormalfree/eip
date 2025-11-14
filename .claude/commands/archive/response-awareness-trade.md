# /response-awareness-trade - Trading Decision Orchestration

## Purpose
Orchestrate crypto trading decision analysis using Phase 0-5 framework with specialized trading agents, stakes-based complexity assessment, and error-correcting metacognitive tag lifecycle.

## Usage
```bash
/response-awareness-trade [trading question]
```

## Examples
```bash
/response-awareness-trade Should I sell my ETH?
/response-awareness-trade What'''s a good entry for BTC?
/response-awareness-trade What'''s current ETH price?
/response-awareness-trade Should I buy more PUMP?
```

## Framework Integration

### Response-Awareness Extension
This command **EXTENDS** the response-awareness framework for trading use cases:
- Uses existing Phase 0-5 orchestration
- Deploys trading specialist agents (NOT coding agents)
- Uses trading metacognitive tags
- Integrates with LCL protocol
- **Maintains backward compatibility** (coding workflows unchanged)

### Mode Detection
```python
# Orchestrator detects task type at Phase 0
if command == "/response-awareness-trade":
    mode = "TRADING"
    deploy_trading_agents()
else:
    mode = "CODING"
    deploy_coding_agents()
```

## Orchestration Model

**CRITICAL PRINCIPLE**: You are the trading orchestrator. You NEVER perform domain work directly.

Your role:
- Assess stakes-based complexity (Phase 0)
- Deploy specialized agents at phase transitions
- Pass context via LCL protocol
- Manage tag lifecycle
- Coordinate phase flow (0→1→2→3→4→5)

**What you DON'T do**:
- ❌ Fetch market data directly (deploy market-data-agent)
- ❌ Analyze cycles inline (deploy cycle-assessment-agent)
- ❌ Read portfolio files inline (deploy agents with file access)
- ❌ Calculate R:R directly (deploy technical-assessment-agent)
- ❌ Make trading recommendations inline (deploy signal-synthesis-agent)

---

## Phase 0: Stakes-Based Complexity Assessment

### Position Detection

Scan question for keywords: **["my", "I have", "should I", "sell my", "buy more", "exit", "take profit"]**

```python
if any(keyword in question.lower() for keyword in position_keywords):
    position_detected = True
    # Read C:\Users\HomePC\Desktop\Code\brentfire\portfolio\active-positions.md
    # Extract: asset, size_sgd, portfolio_pct
else:
    position_detected = False
```

### Stakes Calculation

```python
if portfolio_pct > 30:
    stakes = 3  # Major position (e.g., 44% ETH/WSTETH)
elif portfolio_pct > 10:
    stakes = 2  # Significant position
else:
    stakes = 1  # Small position
```

### Complexity Scoring (0-15)

```python
complexity_score = (
    (2-3 if position_detected else 0) +  # Position involvement
    stakes +                              # 0-3 based on portfolio %
    data_requirements +                   # 0-3 based on analysis depth
    rigor +                               # 0-3 based on verification needed
    logging                               # 0-3 based on decision permanence
)

# Tier routing
if complexity_score <= 3:
    tier = "LIGHT"
elif complexity_score <= 7:
    tier = "MEDIUM"
else:
    tier = "HEAVY"
```

### LCL Exports

```
#LCL_EXPORT_CRITICAL: complexity_tier::LIGHT|MEDIUM|HEAVY
#LCL_EXPORT_CRITICAL: complexity_score::{0-15}
#LCL_EXPORT_CRITICAL: position_detected::{true|false}
#LCL_EXPORT_CRITICAL: stakes_level::{0-3}
#LCL_EXPORT_FIRM: asset_identified::{asset_name}
#LCL_EXPORT_FIRM: portfolio_pct::{percentage}
```

### Complexity Examples

- **LIGHT (0-3)**: "What's current BTC price?" (score: 0)
- **MEDIUM (4-7)**: "Should I buy BTC here?" (score: 5)
- **HEAVY (8-15)**: "Should I sell my ETH?" (44% position, score: 14)

---

## LIGHT Tier (Score 0-3)

**Characteristics**: <1 min, 2 agents, ~5 tags, NO decision logging

### Phase 1: Quick Validation
Deploy **quick-validator-agent**:
- Fetch basic price data
- Answer question briefly
- Create minimal tags

### Phase 4: Quick Verification
Deploy **trade-verifier-agent** (minimal mode):
- Basic sanity checks only
- No risk rules (not a trade decision)

### Phase 5: Minimal Cleanup
Deploy **metacognitive-tag-verifier**:
- Remove all tags
- No preservation (not a decision)

**Example**: "What's current BTC price?" → 45 sec, price answer

---

## MEDIUM Tier (Score 4-7)

**Characteristics**: 2-4 min, 6 agents, ~15 tags, YES decision logging, **NO interactive pause**

### Phase 1: Basic Analysis (SEQUENTIAL)

1. **market-data-agent**: Fetch BTC price, BTC.D, Fear & Greed
2. **cycle-assessment-agent**: Basic cycle phase
3. **technical-assessment-agent**: Entry/exit analysis

### Phase 2: Simple Synthesis

Deploy **signal-synthesis-agent**:
- Synthesize Phase 1 findings
- Calculate basic confluence score (need ≥65%)
- Generate signal (BUY/SELL/HOLD/NO_TRADE)
- **NO interactive pause** (straightforward)

### Phase 3: Validation (PARALLEL)

Deploy **emotional-state-detector** + **pattern-matcher-agent**:
- Emotional: FOMO/panic detection
- Pattern: Match against past decisions/mistakes

### Phase 4: Standard Verification

Deploy **trade-verifier-agent** (standard mode):
- Priority-ordered checking (5 priorities)
- Adjust confidence based on warnings
- If FAIL → EXIT. If PASS → Phase 5.

### Phase 5: Decision Logging & Cleanup (PARALLEL)

Deploy **decision-logger-agent** + **metacognitive-tag-verifier**:
- Logger: Write 7-section decision log, schedule T+7/T+30 reviews
- Tag verifier: Remove ~12 processing tags, preserve 3-4 PERMANENT

**Example**: "Should I buy BTC here?" → 3 min, 6 agents, decision logged

---

## HEAVY Tier (Score 8-15)

**Characteristics**: 4-6 min, 9 agents, 40+ tags, YES decision logging, **YES interactive pause**

### Phase 1: Multi-Path Analysis

**Deploy ORDER**:
1. **market-data-agent** FIRST (others depend on data)
2. Then 3 agents IN PARALLEL: **cycle-assessment-agent** + **comparative-strength-agent** + **technical-assessment-agent**

Each agent writes analysis to `docs/trade_analysis/{timestamp}/`:
- market_data.json
- cycle_assessment.md
- comparative_strength.md
- technical_assessment.md

**Wait for all 3 parallel agents to complete.**

### Phase 2: Signal Synthesis + INTERACTIVE PAUSE

Deploy **signal-synthesis-agent**:
- Synthesize ALL Phase 1 findings
- Resolve conflicting signals
- Calculate confluence score (≥65% threshold)
- Apply consequential thinking (1st/2nd/3rd order)
- Write **docs/trade_analysis/{timestamp}/SIGNAL_BLUEPRINT.md**

### ⚡ INTERACTIVE PAUSE (HEAVY TIER ONLY)

Present blueprint to user:

```
=== SIGNAL BLUEPRINT READY ===

Signal: {BUY|SELL|HOLD|NO_TRADE}
Confidence: {confidence}%
Confluence: {confluence_score}%

Key findings:
- Cycle: {phase} (alt season {probability}%)
- Comparative: {rank}/5 strength
- Technical: {setup}, R:R {ratio}

Warnings: {list risk tags}

=== YOUR OPTIONS ===
1. APPROVE: Proceed to Phase 3
2. MODIFY: Re-run Phase 2
3. REJECT: Exit with NO_TRADE

Your choice?
```

**Handle user response**:
- APPROVE → Proceed to Phase 3
- MODIFY → Re-run with adjustments
- REJECT → Exit

### Phase 3: Pattern Matching & Emotional Validation (PARALLEL)

Deploy **emotional-state-detector** + **pattern-matcher-agent**:
- Emotional: FOMO, panic, revenge (BLOCKING), overconfidence, capitulation
- Pattern: Similarity to past decisions/mistakes, flag >85% matches

### Phase 4: Comprehensive Verification

Deploy **trade-verifier-agent** (comprehensive mode):

**Priority-Ordered Verification** (1-5):

1. **BLOCKING**: `#REVENGE_TRADING_CRITICAL`, `#POSITION_WOULD_EXCEED_20PCT` → FAIL, EXIT
2. **DATA QUALITY**: `#DATA_CONFLICT`, `#DATA_STALE` → Resolve or confidence -5%
3. **SIGNAL QUALITY**: `#POOR_RISK_REWARD`, `#INSUFFICIENT_CONFLUENCE` → Confidence -10 to -20%
4. **EMOTIONAL**: `#FOMO_DETECTED`, `#PANIC_DETECTED` → Confidence -15 to -25% (check emotional override)
5. **PATTERNS**: `#PAST_MISTAKE_MATCH` → Confidence -15 to -30% based on similarity

**If FAIL**: EXIT (no Phase 5). **If PASS**: Proceed.

### Phase 5: Decision Logging & Cleanup (PARALLEL)

Deploy **decision-logger-agent** + **metacognitive-tag-verifier**:

**Logger**: Write **trades/decisions/YYYY-MM-DD_{type}_{asset}.md** with **7 sections**:
1. Core Trade Data
2. Reasoning & Thesis
3. Market Context
4. Risk Assessment
5. Emotional State
6. Knowledge Application
7. Risk Checks & Verification

**Tag Verifier**: Remove ~36 processing tags, preserve 4 PERMANENT:
- `#SIGNAL_GENERATED`
- `#DECISION_LOGGED`
- `#PAST_PATTERN_DOCUMENTED`
- `#REVIEW_SCHEDULED`

### HEAVY Tier Example

**Question**: "Should I sell my ETH?" (44% position)

- **Phase 0**: Score 14 → HEAVY
- **Phase 1**: 4 agents (market-data + 3 parallel analysis)
- **Phase 2**: HOLD signal 65% confidence, blueprint written, user APPROVES
- **Phase 3**: PANIC detected + 85% similarity to 2024 mistake
- **Phase 4**: Confidence 65% → 5% (multiple warnings)
- **Phase 5**: Decision logged, 36 tags removed, 4 preserved

**Output**: "HOLD signal with 5% confidence (severely downgraded). Multiple warnings."

**Duration**: 5 min 30 sec, 9 agents, 3 files created

---

## LCL Protocol Integration

**Export Types**:
- **#LCL_EXPORT_CRITICAL**: Mission-critical (required downstream)
- **#LCL_EXPORT_FIRM**: Important context (recommended)
- **#LCL_EXPORT_CASUAL**: Nice-to-have (optional)

**Phase-to-Phase Flow**:
```
Phase 0 → Phase 1: complexity_tier, position_detected, stakes, asset
Phase 1 → Phase 2: market data, cycle_phase, technical_setup
Phase 2 → Phase 3: signal, confidence, confluence_score
Phase 3 → Phase 4: emotional_state, pattern_matches
Phase 4 → Phase 5: verification_result, confidence_adjusted
```

---

## Success Criteria

- ✅ Orchestrator NEVER does domain work (100% agent deployment)
- ✅ Phase boundaries clear (0→1→2→3→4→5)
- ✅ 3 tiers route correctly (LIGHT/MEDIUM/HEAVY)
- ✅ Tag lifecycle managed (created → verified → cleaned → 4 preserved)
- ✅ Interactive pause works (HEAVY Phase 2)
- ✅ Verification priority-ordered (1-5)
- ✅ Decision logs complete (7 sections)

---

## Cross-References

**Related Files**:
- `.claude/framework/trading-tags.md` - Tag taxonomy (40+ tags)
- `.claude/agents/[9 agents].md` - Agent specifications
- `CRYPTO_SYSTEM_V3_IMPLEMENTATION_BLUEPRINT.md` - Master plan
- `portfolio/goals-and-constraints.md` - Risk rules
- `portfolio/active-positions.md` - Current holdings
- `trades/decisions/` - Past decisions
- `trades/mistakes/` - Past mistakes

**Similar Patterns**:
- `.claude/commands/response-awareness-teach.md` - Teaching orchestrator
- `.claude/framework/educational-tags.md` - Educational tags

---

**This orchestrator coordinates everything. It deploys agents, manages phases, passes context via LCL, and ensures tag lifecycle integrity. It NEVER performs domain work directly.**

