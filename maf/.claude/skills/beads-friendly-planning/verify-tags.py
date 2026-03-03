#!/usr/bin/env python3
"""
Metacognitive Tag Verification Phase for Pass L
Resolves or escalates all active tags before marking ready for plan-to-beads
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any

# Tag resolution strategies
RESOLUTION_STRATEGIES = {
    "#ASSERTION_UNVERIFIED": {"auto_resolve": True, "user_input": False},
    "#PLANNING_ASSUMPTION": {"auto_resolve": "sometimes", "user_input": True},
    "#PREMATURE_COMPLETE": {"auto_resolve": False, "user_input": False},
    "#PATTERN_UNJUSTIFIED": {"auto_resolve": "sometimes", "user_input": True},
    "#CLARITY_DEFERRED": {"auto_resolve": False, "user_input": True},
}


def load_state(state_file: Path) -> Dict[str, Any]:
    """Load state file JSON."""
    with open(state_file) as f:
        return json.load(f)


def save_state(state: Dict[str, Any], state_file: Path):
    """Save state to file."""
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)


def is_essential_for_beads(addition: str) -> bool:
    """Check if a pattern addition is essential for beads execution."""
    essential_patterns = [
        "data contract", "versioning", "interface", "api",
        "schema", "format", "protocol"
    ]
    addition_lower = addition.lower()
    return any(pattern in addition_lower for pattern in essential_patterns)


def verify_tags(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verify and resolve all active tags.

    Returns: (success: bool, report: dict)
    """
    active_tags = state.get("active_tags", [])
    blocking = [t for t in active_tags if t.get("blocking", True)]
    non_blocking = [t for t in active_tags if not t.get("blocking", True)]

    report = {
        "total_tags": len(active_tags),
        "blocking_tags": len(blocking),
        "resolved": 0,
        "documented": 0,
        "remaining": 0,
        "resolution_details": []
    }

    # Resolve blocking tags
    for tag in blocking[:]:  # Copy list to allow modification
        tag_type = tag["tag"]
        strategy = RESOLUTION_STRATEGIES.get(tag_type, {})

        if tag_type == "#ASSERTION_UNVERIFIED":
            # Try to verify with grep
            claim = tag["metadata"].get("claim", "")
            print(f"  Verifying: {claim}")
            # In actual implementation, run grep here
            # For now: mark as needs verification
            report["resolution_details"].append({
                "tag": tag_type,
                "action": "needs_codebase_verification",
                "status": "pending"
            })

        elif tag_type == "#PLANNING_ASSUMPTION":
            severity = tag.get("severity", "medium")
            if severity == "low":
                # Auto-accept low-risk assumptions
                report["resolved"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "assumption": tag["metadata"].get("assumption"),
                    "action": "auto_accepted_low_risk",
                    "status": "resolved"
                })
                blocking.remove(tag)
            else:
                # Document as known uncertainty
                report["documented"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "assumption": tag["metadata"].get("assumption"),
                    "action": "documented_as_assumption",
                    "status": "documented"
                })
                blocking.remove(tag)

        elif tag_type == "#PREMATURE_COMPLETE":
            # Never accept - must add coverage
            report["resolution_details"].append({
                "tag": tag_type,
                "pass": tag["metadata"].get("pass"),
                "missing": tag["metadata"].get("missing"),
                "action": "requires_coverage_addition",
                "status": "blocking"
            })

        elif tag_type == "#PATTERN_UNJUSTIFIED":
            addition = tag["metadata"].get("addition", "")
            if is_essential_for_beads(addition):
                report["resolved"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "addition": addition,
                    "action": "justified_as_essential",
                    "status": "resolved"
                })
                blocking.remove(tag)
            else:
                report["resolved"] += 1
                report["resolution_details"].append({
                    "tag": tag_type,
                    "addition": addition,
                    "action": "removed_non_essential",
                    "status": "resolved"
                })
                blocking.remove(tag)

        elif tag_type == "#CLARITY_DEFERRED":
            # Always needs user input
            report["resolution_details"].append({
                "tag": tag_type,
                "unclear": tag["metadata"].get("unclear"),
                "action": "requires_user_clarification",
                "status": "blocking"
            })

    # Document non-blocking tags
    for tag in non_blocking:
        report["documented"] += 1
        report["resolution_details"].append({
            "tag": tag["tag"],
            "action": "documented_as_known_uncertainty",
            "status": "documented"
        })

    report["remaining"] = len(blocking)

    # Update state
    state["active_tags"] = blocking
    state["verification_report"] = report

    return {
        "success": len(blocking) == 0,
        "report": report
    }


def main():
    if len(sys.argv) != 2:
        print("Usage: verify-tags.py <state-file>")
        sys.exit(1)

    state_file = Path(sys.argv[1])

    if not state_file.exists():
        print(f"❌ State file not found: {state_file}")
        sys.exit(1)

    state = load_state(state_file)

    active_count = len(state.get("active_tags", []))
    blocking_count = len([t for t in state.get("active_tags", []) if t.get("blocking", True)])

    print(f"🔍 Verifying {active_count} active tags ({blocking_count} blocking)...")

    result = verify_tags(state)

    # Save updated state
    save_state(state, state_file)

    # Print report
    print("\n📊 Verification Report:")
    print(f"  Total tags: {result['report']['total_tags']}")
    print(f"  Resolved: {result['report']['resolved']}")
    print(f"  Documented: {result['report']['documented']}")
    print(f"  Remaining: {result['report']['remaining']}")

    if result['success']:
        print("\n✅ All blocking tags resolved - ready for plan-to-beads")
        sys.exit(0)
    else:
        print("\n⚠️  Blocking tags remain - cannot proceed to plan-to-beads")
        print("\nBlocking items:")
        for detail in result['report']['resolution_details']:
            if detail.get('status') == 'blocking':
                print(f"  🚫 {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
