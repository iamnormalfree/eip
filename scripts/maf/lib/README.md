# MAF Core Libraries

This directory contains core libraries for the MAF (Multi-Agent Framework) orchestration system.

## Library Files

### Role-Based Agent Spawning

**`role-based-spawn.sh`** - Role-based agent lookup with fallback support

Provides role-based agent name resolution with multiple fallback methods:

```bash
# Source the library
source scripts/maf/lib/role-based-spawn.sh

# Get agent name by role
AGENT_NAME=$(spawn_agent_by_role "supervisor")
AGENT_NAME=$(spawn_agent_by_role "reviewer")
AGENT_NAME=$(spawn_agent_by_role "implementor-1")
AGENT_NAME=$(spawn_agent_by_role "implementor-2")

# With custom config path
AGENT_NAME=$(spawn_agent_by_role "supervisor" "/path/to/config.json")

# Get agent name by pane index (for tmux spawning)
AGENT_NAME=$(spawn_agent_by_pane 0)  # supervisor
AGENT_NAME=$(spawn_agent_by_pane 1)  # reviewer
AGENT_NAME=$(spawn_agent_by_pane 2)  # implementor-1
AGENT_NAME=$(spawn_agent_by_pane 3)  # implementor-2

# Show current role mappings
show_role_mappings

# List all available roles
list_roles
```

**Role Aliases:**
- `supervisor`: sup, 0
- `reviewer`: rev, 1
- `implementor-1`: imp-1, imp1, 2
- `implementor-2`: imp-2, imp2, 3

**Fallback Priority:**
1. `role_mappings` field in agent-topology.json (preferred)
2. Environment variables (`AGENT_SUPERVISOR`, `AGENT_REVIEWER`, etc.)
3. Default agent names (GreenMountain, BlackDog, OrangePond, FuchsiaCreek)

**Environment Variable Overrides:**
```bash
export AGENT_SUPERVISOR="CustomSupervisor"
export AGENT_REVIEWER="CustomReviewer"
AGENT_NAME=$(spawn_agent_by_role "supervisor")  # Returns "CustomSupervisor"
```

### Role Utilities

**`role-utils.sh`** - Low-level role mapping functions

- `get_agent_by_role ROLE [CONFIG]` - Get agent name for role from config
- `has_role_mapping ROLE [CONFIG]` - Check if role has mapping in config

### Agent Utilities

**`agent-utils.sh`** - Agent lifecycle management

- `create_agent TYPE [ID] [DESCRIPTION]` - Create a new agent
- `start_agent ID` - Start an existing agent
- `stop_agent ID` - Stop a running agent
- `find_agent ID` - Find agent by ID
- `list_agents` - List all agents
- `delete_agent ID` - Delete an agent

### Error Handling

**`error-handling.sh`** - Error handling and logging utilities

- `handle_error CODE MESSAGE [EXIT_CODE]` - Handle errors with logging
- `log_func_info FUNCTION MESSAGE` - Log function call info
- Various logging functions (log_info, log_warn, log_error, etc.)

### Tmux Utilities

**`tmux-utils.sh`** - Tmux session management

- `create_tmux_session NAME` - Create tmux session
- `kill_tmux_session NAME` - Kill tmux session
- `list_tmux_sessions` - List all sessions

### Profile Management

**`profile-loader.sh`** - Agent profile loading
**`credential-manager.sh`** - Credential management

## Config Schema

### agent-topology.json

```json
{
  "$schema": "./agent-config-schema.json",
  "version": "1.0.0",
  "session_name": "maf-session",
  "role_mappings": {
    "supervisor": "GreenMountain",
    "reviewer": "BlackDog",
    "implementor-1": "OrangePond",
    "implementor-2": "FuchsiaCreek"
  },
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "GreenMountain",
      "agent_id": 4,
      "aliases": ["sup", "0"],
      "domains": ["coordination", "routing", "merge-gate"]
    }
  ]
}
```

## Usage Examples

### Example 1: Basic role lookup
```bash
#!/bin/bash
source scripts/maf/lib/role-based-spawn.sh

# Get supervisor agent name
SUPERVISOR=$(spawn_agent_by_role "supervisor")
echo "Supervisor agent: $SUPERVISOR"

# Spawn agent using the name
# (your spawning logic here)
```

### Example 2: With environment override
```bash
#!/bin/bash
source scripts/maf/lib/role-based-spawn.sh

# Override agent names
export AGENT_SUPERVISOR="CustomSuperVisor"
export AGENT_REVIEWER="CustomReviewer"

# Get agent names (will use overrides)
SUPERVISOR=$(spawn_agent_by_role "supervisor")
REVIEWER=$(spawn_agent_by_role "reviewer")
```

### Example 3: Pane-based spawning
```bash
#!/bin/bash
source scripts/maf/lib/role-based-spawn.sh

# Spawn agents for each pane in tmux layout
for pane in 0 1 2 3; do
    AGENT_NAME=$(spawn_agent_by_pane "$pane")
    echo "Pane $pane: $AGENT_NAME"
    # Spawn agent in tmux pane
    # tmux send-keys -t "maf-session:agents.$pane" "$AGENT_NAME" C-m
done
```

## Testing

Run self-test for role-based-spawn.sh:
```bash
bash scripts/maf/lib/role-based-spawn.sh test
```

Run migration readiness tests:
```bash
bash scripts/maf/tests/test-migration-readiness.sh
```
