# Agent Specialization Framework

This directory contains specialized prompts for each agent in the MAF team. These prompts define role-specific behaviors, workflows, and domain expertise.

## How It Works

When agents are spawned via `rebuild-maf-cli-agents.sh`, the script automatically checks for agent-specific prompts in this directory:

1. Reads agent names from `.maf/config/agent-topology.json`
2. Looks for `<agent-name>-prompt.md` in this directory (case-insensitive)
3. If found, displays the prompt in the agent's pane before starting
4. Sets environment variables `AGENT_PROMPT_FILE` and `AGENT_NAME` for agent reference

## Agent Prompt Template

Create a new agent prompt file using this template:

```markdown
# <AgentName> - <Role> Agent

You are **<AgentName>**, the <role> agent for <project>.

## Your Responsibilities

- <Primary responsibility 1>
- <Primary responsibility 2>
- <Primary responsibility 3>

## Your Domain Expertise

You specialize in:
- <Domain area 1>
- <Domain area 2>

## Critical Workflows

### Workflow 1: <Name>
<Step-by-step instructions>

### Workflow 2: <Name>
<Step-by-step instructions>

## Key Integration Points

- **Integration A**: How to use it
- **Integration B**: How to use it

## Decision Trees

When <situation>:
- If <condition A>: Do <action A>
- If <condition B>: Do <action B>

## Communication Patterns

- When to escalate to supervisor
- When to coordinate with other agents
- What to handle independently
```

## Example Prompts

### Supervisor Agent Prompt
Focuses on:
- Coordination guidelines
- Task routing logic
- Decision trees for task classification
- Merge gate management
- Blocker resolution

### Reviewer Agent Prompt
Focuses on:
- Review workflow
- Validation criteria
- Integration with testing tools (Playwright, etc.)
- Approval/rejection patterns
- Feedback delivery

### Implementor Agents
Focus on:
- Mandatory workflow: Response-Awareness
- Domain-specific patterns
- Testing requirements
- Code quality standards

## Customizing for Your Project

### Step 1: Update Agent Topology

Edit `.maf/config/agent-topology.json`:

```json
{
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "YourSupervisorName",
      "domains": ["coordination", "routing"]
    },
    {
      "index": 2,
      "role": "implementor-1",
      "agent_name": "YourBackendImplementor",
      "domains": ["backend", "api", "database"]
    }
  ]
}
```

### Step 2: Create Agent Prompts

For each agent, create a prompt file:

```bash
# For agent named "YourSupervisorName"
nano .maf/agents/yoursupervisorname-prompt.md

# For agent named "YourBackendImplementor"
nano .maf/agents/yourbackendimplementor-prompt.md
```

### Step 3: Spawn Agents

```bash
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force
```

Each agent will display their specialized prompt on startup:

```
═══════════════════════════════════════════════════
  Agent: YourSupervisorName
  Specialized prompt loaded from: yoursupervisorname-prompt.md
═══════════════════════════════════════════════════
```

## Best Practices

### DO:
- ✅ Keep prompts focused on role-specific expertise
- ✅ Include mandatory workflows (like Response-Awareness)
- ✅ Provide decision trees for common scenarios
- ✅ Document integration points (tools, APIs, systems)
- ✅ Specify communication patterns and escalation paths

### DON'T:
- ❌ Duplicate general MAF documentation
- ❌ Make prompts too long (>500 lines recommended)
- ❌ Include secrets or sensitive information
- ❌ Hardcode project-specific paths (use environment variables)
- ❌ Overlap with other agent responsibilities

## Environment Variables Available to Agents

When a specialized prompt is loaded, these environment variables are set:

- `AGENT_NAME`: The agent's name (e.g., "RateRidge")
- `AGENT_PROMPT_FILE`: Full path to the prompt file
- `PROJECT_ROOT`: Auto-detected project root directory

## Examples

### Mortgage System Agents (Nextnest)
- **RateRidge**: Mortgage calculation supervisor
- **AuditBay**: Reviewer with Playwright integration
- **LedgerLeap**: Backend implementor for loan logic
- **PrimePortal**: Frontend implementor for portal UI

### Content Publishing Agents (Roundtable)
- **GreenMountain**: Content workflow supervisor
- **BlackDog**: Reviewer for quality assurance
- **OrangePond**: Frontend/site implementor
- **FuchsiaCreek**: Backend/API implementor

## Troubleshooting

### Prompt Not Loading

Check that the filename matches the agent name (case-insensitive):
- Agent name: "RateRidge" → File: "rateridge-prompt.md"
- Agent name: "LedgerLeap" → File: "ledgerleap-prompt.md"

### Wrong Prompt Being Loaded

Verify the agent name in `.maf/config/agent-topology.json` matches your intent.

### Agent Can't Access Prompt

The prompt file path is exported as `AGENT_PROMPT_FILE`. Agents can reference it:
```bash
cat $AGENT_PROMPT_FILE
```

## Related Documentation

- `../config/agent-topology.json` - Agent team structure
- `../../scripts/maf/rebuild-maf-cli-agents.sh` - Agent spawning script
- `../../agents.md` - General agent operations guide
- `../../claude.md` - Claude/Response Awareness documentation
