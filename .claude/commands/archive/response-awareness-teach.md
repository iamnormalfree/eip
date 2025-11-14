# /response-awareness-teach - Educational Mentoring Command

## Purpose
Teach crypto/money markets concepts using response-awareness framework's Phase 0-5 orchestration with educational subagents, optimized for Kolbe 5392 learner.

## Usage
```bash
/response-awareness-teach [concept-name]
```

## Examples
```bash
/response-awareness-teach eth-late-cycle
/response-awareness-teach support-resistance
/response-awareness-teach alt-season
```

## Framework Integration

### Response-Awareness Extension
This command **EXTENDS** the response-awareness framework for educational use cases:
- Uses existing Phase 0-5 orchestration
- Deploys educational subagents (NOT coding agents)
- Uses educational metacognitive tags
- Integrates with LCL protocol
- **Maintains backward compatibility** (coding workflows unchanged)


### Mode Detection
```python
# Orchestrator detects task type at Phase 0
if command == "/response-awareness-teach":
    mode = "TEACHING"
    deploy_educational_agents()
else:
    mode = "CODING"
    deploy_coding_agents()
```

## Phase 0: Understanding Assessment

### Purpose
Assess user's current knowledge and identify prerequisites before teaching.

### Agents Deployed
- **gap-identifier**: Check prerequisites and knowledge gaps

### Workflow
1. Load user's knowledge graph (`concepts/knowledge-graph.json`)
2. Query mastery level of target concept
3. Map prerequisite dependencies
4. Deploy `gap-identifier` to probe prerequisites
5. Identify missing foundational knowledge
6. Create learning path if gaps detected

### Educational Tags Used
- `#PREREQUISITE_MISSING: concept::dependency`
- `#KNOWLEDGE_GAP_DETECTED: concept::specific_gap`
- `#PREREQUISITE_CONFIRMED: concept::verified`
- `#LEARNING_PATH_BLOCKED: concept::prerequisites_missing`
- `#LEARNING_PATH_CLEAR: concept::prerequisites_satisfied`

### LCL Exports
```
#LCL_EXPORT_CRITICAL: prerequisites_required::[list]
#LCL_EXPORT_CRITICAL: prerequisites_confirmed::[list]
#LCL_EXPORT_CRITICAL: prerequisites_missing::[list]
#LCL_EXPORT_CRITICAL: knowledge_gaps_detected::[list]
#LCL_EXPORT_CRITICAL: user_mastery_level::surface|functional|deep|mastery
#LCL_EXPORT_CRITICAL: teaching_ready::true|false
```

### Decision Point
- **If prerequisites MISSING**: Teach prerequisites first, then retry
- **If prerequisites CONFIRMED**: Proceed to Phase 1

---

## Phase 1: Concept Exploration (Planning)

### Purpose
Generate multiple explanation approaches tailored to user's learning style and knowledge level.

### Agents Deployed
- **concept-explainer**: Generate 3 explanation approaches

### Workflow
1. Receive prerequisites status from Phase 0 (via LCL)
2. Deploy `concept-explainer` with user's learning style:
   - Kolbe 5392: Mistake-first 70%, Chart-driven 30%
   - Max 5 sentences per concept
   - Calibrate complexity to mastery level
3. Generate 3 approaches:
   - **Approach A**: Analogical (Quick Start 9 friendly)
   - **Approach B**: Historical Pattern (Fact Finder 5 friendly)
   - **Approach C**: Causal Chain (Deep mastery path)
4. Mark teaching assumptions with tags
5. Identify potential analogies and examples

### Educational Tags Used
- `#TEACHING_ASSUMPTION: concept::prerequisite`
- `#COMPLEXITY_OVERLOAD: threshold_exceeded::concept_density`
- `#ANALOGY_MISMATCH: analogy::user_experience_domain`

### LCL Exports
```
#LCL_EXPORT_CRITICAL: approach_a::analogical_water_pressure
#LCL_EXPORT_CRITICAL: approach_b::historical_2021_eth_rally
#LCL_EXPORT_CRITICAL: approach_c::causal_rotation_mechanics
#LCL_EXPORT_CRITICAL: complexity_calibrated::functional_level
#LCL_EXPORT_CRITICAL: assumptions_marked::3_total
```

---

## Phase 2: Explanation Synthesis

### Purpose
Select optimal explanation approach based on user profile and synthesize coherent teaching strategy.

### Workflow
1. Receive 3 approaches from Phase 1 (via LCL)
2. Evaluate each approach against user's Kolbe profile:
   - Quick Start 9: Prefer mistake-first scenarios
   - Fact Finder 5: Prefer concrete examples
   - Follow Through 3: Prefer minimal structure
   - Implementor 2: Prefer text-based (no visual tools)
3. Select optimal approach
4. Synthesize final explanation structure
5. Validate all teaching assumptions
6. Export selected strategy via LCL

### Selection Criteria
```python
def select_optimal_approach(approaches, user_profile):
    """
    Score each approach:
    - Quick Start 9: +10 for mistake-first, +5 for scenarios
    - Fact Finder 5: +10 for historical examples, +5 for data
    - Follow Through 3: +10 for <5 sentences, -5 for complex structure
    - Implementor 2: +10 for text-based, -10 for visual tools
    """

    scores = {}
    for approach in approaches:
        score = calculate_kolbe_match(approach, user_profile)
        scores[approach] = score

    return max(scores, key=scores.get)
```

### LCL Exports
```
#LCL_EXPORT_CRITICAL: selected_approach::historical_pattern_eth_2021
#LCL_EXPORT_CRITICAL: teaching_strategy::mistake_first_with_chart
#LCL_EXPORT_CRITICAL: complexity_level::functional
#LCL_EXPORT_CRITICAL: estimated_duration::15_minutes
```

---

## Phase 3: Explanation Delivery (Implementation)

### Purpose
Deliver tailored explanation using selected approach.

### Agents Deployed
- **concept-explainer**: Deliver explanation

### Workflow
1. Receive selected teaching strategy from Phase 2 (via LCL)
2. Deploy `concept-explainer` in delivery mode
3. Present explanation with:
   - Max 5 sentences per concept (Follow Through 3)
   - Mistake-first scenario (Quick Start 9)
   - Chart-driven patterns (30% of time)
   - Concrete examples (Fact Finder 5)
4. Mark any explanation drift with tags
5. Detect complexity overload
6. Check analogy effectiveness

### Educational Tags Used
- `#TEACHING_ASSUMPTION: concept::prerequisite` (verify)
- `#EXPLANATION_DRIFT: direction::away_from_level`
- `#ANALOGY_MISMATCH: analogy::user_domain`
- `#COMPLEXITY_OVERLOAD: concepts_introduced::count`

### Example Delivery (ETH Late-Cycle)
```markdown
## ETH Late-Cycle Behavior

Historical pattern: ETH outperforms BTC late in bull cycles.
But it needs a "spark" to move.

#TEACHING_ASSUMPTION: eth_late_cycle::user_knows_btc_cycles

**Mistake-First Scenario**:
Dec 2021: BTC hits $69k ATH. What happens to ETH?
→ [User predicts]
→ Actual: ETH rallied 40% while BTC corrected
→ Why: Money rotates from BTC → large caps late cycle

**The "Spark" Concept**:
Spark = Narrative shift + Macro liquidity
2021 spark: DeFi hype + Fed still dovish

#LCL_EXPORT_CRITICAL: teaching_delivered::historical_pattern_successful
```

---

## Phase 4: Verification

### Purpose
Verify true comprehension vs surface-level parroting.

### Agents Deployed
- **understanding-verifier**: Check comprehension
- **confusion-resolver** (if confusion detected)

### Workflow
1. Deploy `understanding-verifier` after explanation delivery
2. Verify using 5 strategies:
   - **Strategy 1**: Explain in own words (no parroting)
   - **Strategy 2**: Apply to novel scenario
   - **Strategy 3**: Edge case probing
   - **Strategy 4**: Inverse test (when NOT to use)
   - **Strategy 5**: Parroting detection
3. Assess mastery level: surface / functional / deep / mastery
4. If confusion detected → deploy `confusion-resolver`
5. If understanding verified → proceed to Phase 5

### Educational Tags Used
- `#UNDERSTANDING_VERIFIED: concept::verification_method`
- `#SURFACE_UNDERSTANDING: concept::parroting_detected`
- `#KNOWLEDGE_GAP_DETECTED: concept::cannot_apply`
- `#CONCEPT_CONFUSION: signal::user_response`

### Confusion Resolution Loop
```python
if confusion_detected:
    deploy_confusion_resolver()

    # Identify confusion source
    - Contradiction in statements
    - Wrong mental model
    - Overgeneralization
    - Undergeneralization
    - Analogy misinterpretation

    # Deploy resolution strategy
    - Targeted counter-example
    - Simplified re-explanation
    - Misconception correction
    - Prerequisite teaching

    # Re-verify understanding
    deploy_understanding_verifier()

    # Max 3 resolution attempts
    if attempts > 3:
        escalate_to_human_review()
```

### LCL Exports
```
#LCL_EXPORT_CRITICAL: understanding_verified::true|false
#LCL_EXPORT_CRITICAL: mastery_level_assessed::surface|functional|deep|mastery
#LCL_EXPORT_CRITICAL: confusion_resolved::true|false
#LCL_EXPORT_CRITICAL: misconceptions_corrected::[list]
```

---

## Phase 5: Knowledge Persistence (Reporting)

### Purpose
Document learned concepts, update knowledge graph, schedule verification checkpoints, generate learning summary.

### Agents Deployed
- **knowledge-persistence-agent**: Update knowledge graph
- **metacognitive-tag-verifier**: Clean up educational tags

### Workflow
1. Receive verification results from Phase 4 (via LCL)
2. Deploy `knowledge-persistence-agent` to:
   - Update `concepts/knowledge-graph.json`
   - Add/update concept entry with mastery level
   - Document verification method used
   - Schedule T+30/60/90 checkpoints
   - Update quarterly progress (3 concepts/quarter goal)
3. Deploy `metacognitive-tag-verifier` to:
   - Remove all educational processing tags
   - Preserve `#UNDERSTANDING_VERIFIED` for documentation
   - Preserve `#MISCONCEPTION_IDENTIFIED` for history
   - Clean up `#TEACHING_ASSUMPTION` tags
4. Generate learning summary
5. Write session log to `sessions/recent/`

### Knowledge Graph Update
```json
{
  "concepts": [
    {
      "concept": "eth-late-cycle",
      "mastery_level": "functional",
      "learned_date": "2025-10-04",
      "last_verified": "2025-10-04",
      "session_id": "teach_20251004_140000",
      "verified_understanding": true,
      "prerequisites_confirmed": ["btc-cycles", "alt-season"],
      "related_concepts": ["macro-liquidity", "rotation-trading"],
      "examples_mastered": ["eth_2021_rally"],
      "misconceptions_resolved": [],
      "teaching_strategy_effective": "historical_pattern_mistake_first",
      "teaching_duration_minutes": 15,
      "next_review_suggested": "2025-11-03"
    }
  ],
  "quarterly_progress": {
    "2025_Q4": {
      "target": 3,
      "mastered": 0,
      "in_progress": 4,
      "status": "OVERLOADED"
    }
  }
}
```

### Session Log Creation
```markdown
# Teaching Session: eth-late-cycle
**Date**: 2025-10-04
**Duration**: 15 minutes
**Mastery Achieved**: Functional

## Prerequisites Checked
- btc-cycles: ✓ Confirmed (functional)
- alt-season: ✓ Confirmed (functional)
- macro-liquidity: ✓ Confirmed (surface)

## Teaching Approach
Strategy: Historical Pattern + Mistake-First
Scenario: Dec 2021 ETH rally prediction

## Understanding Verified
- Own words explanation: ✓ Passed
- Novel application: ✓ Passed
- Edge case awareness: ✗ Partial (bear market exception missed)
- Inverse understanding: ✓ Passed

## Mastery Assessment
Level: **Functional**
Reason: Can apply to familiar contexts, some edge cases missed

## Knowledge Gaps
- Bear market behavior exception (optional to fill)

## Next Steps
- T+30 Verification: Nov 3, 2025
- Optional: Brief on bear market alt behavior
```

### LCL Exports
```
#LCL_EXPORT_CRITICAL: knowledge_graph_updated::true
#LCL_EXPORT_CRITICAL: session_logged::sessions/recent/teach_20251004_eth_late_cycle.md
#LCL_EXPORT_CRITICAL: next_verification_date::2025-11-03
#LCL_EXPORT_CRITICAL: quarterly_progress::4_active_concepts
```

---

## Educational Metacognitive Tags (Complete List)

### Planning Phase (0-2)
- `#TEACHING_ASSUMPTION: concept::prerequisite`
- `#COMPLEXITY_OVERLOAD: threshold_exceeded::concept_density`
- `#ANALOGY_MISMATCH: analogy::user_domain`
- `#EXPLANATION_DRIFT: direction::away_from_level`

### Verification Phase (4)
- `#UNDERSTANDING_VERIFIED: concept::verification_method`
- `#SURFACE_UNDERSTANDING: concept::parroting_detected`
- `#KNOWLEDGE_GAP_DETECTED: concept::missing_ability`
- `#PREREQUISITE_MISSING: concept::dependency`
- `#CONCEPT_CONFUSION: signal::user_response`

### Resolution Phase (4)
- `#MISCONCEPTION_IDENTIFIED: old_belief::new_understanding`
- `#CONFUSION_RESOLVED: concept::resolution_method`
- `#RE_TEACHING_REQUIRED: concept::simplified_approach`

### Persistence Phase (5)
- `#LEARNED_CONCEPT: concept::mastery_level` (kept for documentation)

### Tag Lifecycle
1. **Created**: During planning/delivery (Phases 0-3)
2. **Verified**: During verification (Phase 4)
3. **Cleaned**: By metacognitive-tag-verifier (Phase 5)
4. **Preserved**: Only documentation tags kept

---

## LCL Protocol Integration

### Session-Level Context (Temporary)
```
#LCL: concept_to_teach::eth-late-cycle
#LCL: user_mastery_level::functional
#LCL: learning_style::mistake_first_70%_chart_driven_30%
#LCL: kolbe_profile::5392
```

### Persistent Knowledge Graph (Permanent)
```
#LCL_EXPORT_FIRM: knowledge_graph::concepts/knowledge-graph.json
#LCL_EXPORT_FIRM: prerequisites_system::CONCEPT_DEPENDENCIES_map
#LCL_EXPORT_FIRM: quarterly_goal::3_concepts_per_quarter
```

### Phase-to-Phase Context Passing
```
Phase 0 → Phase 1: prerequisites_status, user_mastery_level
Phase 1 → Phase 2: explanation_approaches, complexity_calibration
Phase 2 → Phase 3: selected_teaching_strategy
Phase 3 → Phase 4: explanation_delivered, tags_to_verify
Phase 4 → Phase 5: mastery_assessment, misconceptions_corrected
```

---

## Backward Compatibility Guarantee

### What Stays Unchanged
✅ `/response-awareness` command (coding mode)
✅ Existing coding agents (integration-specialist, metacognitive-tag-verifier, etc.)
✅ Existing metacognitive tags for coding
✅ LCL protocol semantics
✅ Phase 0-5 orchestration structure

### What's Added
➕ `/response-awareness-teach` command (teaching mode)
➕ 5 educational agents (concept-explainer, understanding-verifier, confusion-resolver, gap-identifier, knowledge-persistence-agent)
➕ Educational metacognitive tags (parallel to coding tags)
➕ Knowledge graph system (concepts/knowledge-graph.json)

### Mode Separation
```python
# Orchestrator ensures clean separation
if mode == "CODING":
    allowed_agents = [
        "integration-specialist",
        "metacognitive-tag-verifier",
        # ... coding agents only
    ]
    allowed_tags = [
        "#COMPLETION_DRIVE",
        "#PATTERN_MOMENTUM",
        # ... coding tags only
    ]

if mode == "TEACHING":
    allowed_agents = [
        "concept-explainer",
        "understanding-verifier",
        "confusion-resolver",
        "gap-identifier",
        "knowledge-persistence-agent"
    ]
    allowed_tags = [
        "#TEACHING_ASSUMPTION",
        "#UNDERSTANDING_VERIFIED",
        # ... educational tags only
    ]
```

---

## Integration with Existing Crypto Knowledge

### Concept Sources
1. **crypto-knowledge.md**: Foundational concepts for teaching
2. **goals.md**: User profile (Kolbe 5392, learning pace, financial goals)
3. **concepts/active/**: Current learning concepts

### Market Data Integration
- Fetch real charts for pattern recognition exercises
- Use historical examples from crypto-knowledge.md
- Apply concepts to user's actual portfolio (from portfolio/current-snapshot.md)

### Trade Analysis Integration
- Teaching concepts applied during trade analysis
- Knowledge graph consulted before trade decisions
- Misconceptions identified through trading mistakes

---

## Success Criteria

### Teaching Success
- User achieves functional+ mastery of concept
- All prerequisites confirmed before teaching
- No confusion left unresolved
- Knowledge graph accurately updated
- Verification checkpoints scheduled

### Framework Integration Success
- `/response-awareness` unchanged (backward compatibility)
- Educational agents never deployed in coding mode
- LCL protocol correctly passes context
- Metacognitive tags properly managed (created + cleaned)
- Phase 0-5 orchestration flows correctly

### User Experience Success
- Kolbe 5392 optimized (max 5 sentences, mistake-first, chart-driven)
- 3 concepts/quarter goal tracked
- Learning velocity monitored
- Knowledge decay detected and addressed
- Portfolio trading applies learned concepts
