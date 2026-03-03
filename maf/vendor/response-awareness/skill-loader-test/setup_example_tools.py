#!/usr/bin/env python3
"""
Minimal ChromaDB Setup for Semantic Tool Loader - Portable Example

This demonstrates the semantic loader with a few example tools.
Customize by adding your own tools/resources to the database.
"""

import sys
from pathlib import Path
import chromadb
from chromadb.config import Settings


# Example tools to demonstrate the system
EXAMPLE_TOOLS = [
    {
        'id': 'metacognitive-tags',
        'name': 'Metacognitive Tag Reference',
        'type': 'tool',
        'description': 'Response awareness metacognitive tagging system. Use when working with observer circuit patterns, completion drive detection, or marking uncertainties during complex multi-agent workflows.',
        'content': '''# Metacognitive Tag Reference

## Purpose
Tags that mark observable processing patterns during response generation, enabling systematic verification.

## Core Tags

### #COMPLETION_DRIVE
Generator filling knowledge gaps with plausible content rather than marking uncertainty.

**When to use**: When you notice yourself generating specifics without verification.

### #CARGO_CULT
Pattern-completion adding unrequested features from training distributions.

**When to use**: Adding features beyond requirements due to pattern association.

### #CONTEXT_DEGRADED
Unable to retrieve earlier specifics with precision, generating educated reconstructions.

**When to use**: When you can't recall exact earlier details with confidence.

### #PATH_DECISION
Multiple implementation paths considered (permanent documentation of choice).

**When to use**: Documenting why path A was chosen over path B.

### #POISON_PATH
Specific terminology biasing probability space toward suboptimal patterns.

**When to use**: When certain phrasings lead to worse implementations.

### #RESOLUTION_PRESSURE
Increasing bias toward conclusion as response length increases.

**When to use**: When feeling pressure to wrap up before thorough completion.
'''
    },
    {
        'id': 'git-workflow',
        'name': 'Git Workflow Helper',
        'type': 'tool',
        'description': 'Git commit and PR workflow best practices. Use when creating commits, pull requests, or managing git branches.',
        'content': '''# Git Workflow Helper

## Commit Message Format
- Start with action verb (add, fix, update, refactor)
- Focus on "why" not "what"
- Keep under 72 characters for first line
- End with Claude Code attribution

## Example
```
Add user authentication with JWT tokens

- Implement token generation and validation
- Add middleware for protected routes
- Include refresh token rotation

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pull Request Format
Include:
- Summary (1-3 bullet points)
- Test plan (checklist of validation steps)
- Claude Code attribution
'''
    },
    {
        'id': 'response-awareness-framework',
        'name': 'Response Awareness Quick Guide',
        'type': 'tool',
        'description': 'Meta-cognitive orchestration framework for complex development tasks. Use when planning multi-system features, handling >5 integration points, or coordinating specialized agents.',
        'content': '''# Response Awareness Framework - Quick Reference

## When to Use
- **>5 integration points** between systems
- **>3 distinct domains** requiring coordination
- **Cross-system dependencies** with assumption chains
- **Architectural decisions** affecting multiple subsystems

## Command Selection

### /response-awareness-light
- 3-5 files with coordination
- Mostly clear requirements
- Simplified 3-phase workflow

### /response-awareness
- Complete 6-phase workflow
- Multi-system changes
- Automatic orchestration

### /response-awareness-plan → /response-awareness-implement
- Want to review architecture first
- Critical decisions need approval
- Interactive planning phase

## Key Mechanisms
- **LCL (Latent Context Layer)**: Blueprint storage in parallel awareness
- **Metacognitive Tags**: Mark observer-detected patterns
- **Pressure Management**: Deploy continuation agents when needed
'''
    }
]


def main():
    """Initialize ChromaDB with example tools."""

    # Paths
    script_dir = Path(__file__).parent
    db_dir = script_dir / "skill_db"

    print("=" * 70)
    print("SEMANTIC TOOL LOADER - EXAMPLE SETUP")
    print("=" * 70)
    print()
    print(f"Database location: {db_dir}")
    print()

    # Create database directory
    db_dir.mkdir(exist_ok=True)

    # Initialize ChromaDB
    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(
        path=str(db_dir),
        settings=Settings(anonymized_telemetry=False)
    )

    # Delete existing collection if exists
    try:
        client.delete_collection("game_skills")
        print("[OK] Deleted existing collection")
    except:
        pass

    # Create collection
    collection = client.create_collection(
        name="game_skills",
        metadata={"description": "Semantic tools and resources"}
    )
    print("[OK] Created collection")
    print()

    # Add example tools
    print("Adding example tools...")
    print()

    documents = []
    metadatas = []
    ids = []

    for tool in EXAMPLE_TOOLS:
        # Use description for semantic matching
        documents.append(tool['description'])
        metadatas.append({
            'name': tool['name'],
            'type': tool['type'],
            'description': tool['description'],
            'content': tool['content']  # Store full content in metadata
        })
        ids.append(tool['id'])

        print(f"  [OK] {tool['name']}")

    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    print()
    print(f"[OK] Added {len(EXAMPLE_TOOLS)} tools to ChromaDB")
    print()

    # Test semantic search
    print("=" * 70)
    print("TESTING SEMANTIC SEARCH")
    print("=" * 70)
    print()

    test_queries = [
        "What metacognitive tags should I use?",
        "How to write a commit message?",
        "When should I use response awareness framework?"
    ]

    for query in test_queries:
        results = collection.query(
            query_texts=[query],
            n_results=2
        )

        print(f"Query: '{query}'")
        if results['ids'] and results['ids'][0]:
            for i, (tool_id, distance) in enumerate(zip(results['ids'][0], results['distances'][0])):
                metadata = results['metadatas'][0][i]
                similarity = 1 - distance
                print(f"  {i+1}. {metadata['name']} ({similarity:.1%} match)")
        else:
            print("  No results")
        print()

    print("=" * 70)
    print("[OK] SETUP COMPLETE!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Configure hooks in .claude/settings.json")
    print("2. Read a file related to commits, tags, or frameworks")
    print("3. Hook will notify you of relevant tools")
    print("4. Load tool: Bash(\"python .claude/hooks/query_skill.py 'Tool Name'\")")
    print()
    print("To add your own tools:")
    print("- Edit EXAMPLE_TOOLS in this file")
    print("- Re-run: python skill-loader-test/setup_example_tools.py")
    print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
