# /first-principles - Mechanistic Reasoning Tool

## Purpose
Activate first-principles reasoning mode for explaining complex systems, debugging, or architectural analysis. Think mechanistically from primitives rather than from abstractions or jargon.

**Use when:**
- Explaining how complex systems actually work (not just what they're called)
- Debugging by understanding causal mechanisms
- Analyzing architecture from fundamental building blocks
- Need clarity over technical jargon

**Don't use when:**
- Simple implementation tasks
- Standard feature development
- You just need quick answers with standard terminology

---

## Core Principles

### 1. Observe Before Labeling
Describe what's actually happening before invoking terminology.

**Instead of:** "This uses the Observer pattern"
**Think:** "When X changes, it notifies a list of things that care about X, and each one updates itself"

### 2. Reduce to Mechanism
Every explanation must reveal what interacts, moves, or constrains. If you can't point to the mechanism, dig deeper.

**Question:** "How does this work?"
**Bad answer:** "It uses async/await"
**Good answer:** "The function pauses here, the JS engine continues other work, when the promise resolves the engine resumes this function from where it paused"

### 3. Build from Primitives
Start with the simplest accurate description, then recombine.

**Example:** Instead of "implements reactive state management", explain:
1. Variables that notify when changed
2. Functions that re-run when their dependencies change
3. The notification happens through subscriptions
4. This creates reactive behavior

### 4. Test the Model
Use counterexamples, edge cases, or thought experiments to stress-test explanations.

**After explaining:** "If that's how it works, what happens when [edge case]?"

### 5. Speak Without Decoration
Minimize jargon. Prioritize clarity → simplicity → inevitability.

Use technical terms only when they compress understanding without deleting causality.

---

## Operational Loop

For any analysis, iterate through:

1. **Observe**: What is actually occurring in the code/system?
2. **Simplify**: What's the minimal accurate description?
3. **Rebuild**: How do the parts combine to yield the effect?
4. **Test**: Does this model generalize? What breaks it?
5. **Express**: Can I explain this even if key technical terms were removed?

Repeat until the explanation feels inevitable.

---

## Example Analysis Format

When explaining complex systems:

```
## What's Actually Happening

[Describe observable behavior without jargon]

## The Mechanism

[Explain how components interact to produce that behavior]
- What triggers the process
- What state changes
- What dependencies exist
- What the causal chain is

## Why It Works This Way

[Explain the constraints or requirements that lead to this design]

## Edge Cases / Limitations

[Test the model - what situations would break this?]

## Compression Statement

[One-line principle that captures the essence without jargon]
```

---

## Practical Examples

### Example 1: Explaining React useState

**Traditional explanation:**
"useState is a React hook that lets you add state to functional components"

**First principles explanation:**
```
What's happening:
- You call useState(initialValue)
- You get back [currentValue, functionToChangeIt]
- When you call that function, React:
  1. Stores the new value
  2. Marks this component for re-render
  3. Calls your component function again
  4. Returns the updated value from storage

Mechanism:
React maintains an array of state values indexed by call order.
Each useState call reads/writes to its position in that array.
The setter function triggers React's reconciliation scheduler.

Why this design:
- Closures preserve the setter function identity
- Array indexing allows multiple useState calls
- Automatic re-rendering keeps UI synchronized with state

Compression: "Persistent storage paired with automatic re-rendering"
```

### Example 2: Debugging a race condition

**Jargon approach:**
"There's a race condition in your async state updates"

**Mechanistic approach:**
```
Observe:
- Button clicked twice quickly
- Second response arrives before first
- UI shows stale data

Mechanism:
1. First click: send request A, timestamp T1
2. Second click: send request B, timestamp T2
3. Response B arrives (fast server path)
4. State updates to B's data
5. Response A arrives (slow server path)
6. State updates to A's data (overwrites B)

The problem: No tracking of which response is newest
The fix: Either cancel old requests OR timestamp and ignore stale responses

Test: What if clicked 3 times? Same issue, last arrival wins (not last click)
```

### Example 3: Architecture Analysis

**Task:** "Explain how our AI broker chat system works"

**First principles breakdown:**
```
Observable behavior:
- User types message → AI responds within seconds
- Responses feel conversational
- System remembers conversation context

Causal chain:
1. User message → saved to database (conversation persistence)
2. Message → queued for processing (decouples UI from AI latency)
3. Worker picks up message from queue
4. Worker loads conversation history (context retrieval)
5. Worker calls AI API with history + new message
6. AI response → saved to database
7. UI polls for new messages (or websocket pushes)
8. User sees response

Key mechanisms:
- Queue: Handles load spikes, survives server restarts
- History: AI needs context to be conversational
- Async: UI stays responsive during AI processing
- Persistence: Conversation survives page refresh

Constraints this solves:
- AI latency (5-30s) can't block UI
- Multiple concurrent users need isolation
- System needs crash recovery
- Conversations need continuity

Edge cases:
- Queue fills up → Need backpressure/limits
- AI API down → Need retry logic + failure states
- User leaves before response → Orphaned processing (acceptable)

Compression: "Async queue-based conversation orchestration with persistent context"
```

---

## When to Exit First-Principles Mode

Once you have clarity and a working mental model, return to normal communication:

**Signals to exit:**
- The explanation is clear and testable
- User has what they need
- Further detail would be excessive
- Moving into implementation (not analysis)

**How to exit:**
Simply proceed with normal communication. First-principles mode is analytical, not a permanent state.

---

## Usage Pattern

```bash
# Activate for complex explanation
User: "I don't understand how our form validation works"
/first-principles
[Claude provides mechanistic breakdown]

# Activate for debugging
User: "Why does the chat sometimes show duplicate messages?"
/first-principles
[Claude traces causal mechanism]

# Activate for architecture review
User: "Explain our authentication flow from first principles"
/first-principles
[Claude builds up from primitives]
```

---

## Integration with Other Commands

**Combine with systematic debugging:**
- `/first-principles` for understanding mechanism
- Then standard debugging tools to fix

**Before response-awareness:**
- Use first-principles mode to clarify complex requirements
- Then route through `/response-awareness` with clarified understanding

**During architecture discussions:**
- First-principles mode helps strip away assumptions
- Reveals actual constraints and mechanisms

**Versus /embody:**
- `/first-principles` is a **structured analytical tool** with explicit steps
- `/embody` is a **meta-framework** for cognitive embodiment without metacommentary
- Use `/first-principles` when you want mechanistic explanations
- Use `/embody` when you want to think through a specific cognitive lens

---

## Output Format Markers (Optional)

When in first-principles mode, optionally prefix sections:

```
[OBSERVE] What's happening in the code...
[MECHANISM] Here's how the parts interact...
[TEST] Edge case: what if...
[COMPRESS] Core principle: ...
```

This is optional - clarity matters more than format.

---

**Command Version**: 1.0
**Created**: 2025-10-24
**Purpose**: First-principles reasoning for complex system analysis
