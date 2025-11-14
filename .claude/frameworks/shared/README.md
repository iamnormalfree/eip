# Claude Shared Repository

This repository contains shared response-awareness framework, Superpowers skills, and templates for use across multiple projects.

## Structure

\\\
claude-shared/
├── frameworks/
│   ├── response-awareness/          # Response-awareness tiers
│   │   ├── response-awareness-light/
│   │   ├── response-awareness-medium/
│   │   ├── response-awareness-heavy/
│   │   ├── response-awareness-full/
│   │   └── response-awareness-shared/
│   └── superpowers/                 # Superpowers skills
│       ├── brainstorming.md
│       └── systematic-debugging.md
│
├── templates/                       # Templates for new projects
│   ├── config/                      # Config file templates
│   ├── agents/                      # Reusable agents
│   └── customizations/              # Customization templates
│
└── scripts/                         # Helper scripts
\\\

## Usage

### For New Projects

Use git subtree to add this shared code to your project:

\\\ash
cd your-project
git subtree add --prefix .claude/frameworks/shared \
  https://github.com/YOUR_USERNAME/claude-shared.git main --squash
\\\

### To Update Projects

When shared code updates, pull changes:

\\\ash
cd your-project
git subtree pull --prefix .claude/frameworks/shared \
  https://github.com/YOUR_USERNAME/claude-shared.git main --squash
\\\

## Projects Using This

- NextNest
- (Add your other projects here)

## Last Updated

2025-10-18

## Test Update

✅ **Test successful** - This line was added to test the git subtree workflow.

If you see this in your project after running `git subtree pull`, the workflow is working correctly!
