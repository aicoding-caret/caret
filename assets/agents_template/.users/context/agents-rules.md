# Caret Rules Guide

Human-readable guide for `.agents/context/agents-rules.json`.

## Purpose

The `agents-rules.json` file is the **Single Source of Truth (SoT)** for AI agent rules.
This document explains the rules in detail for human developers.

## Rule Categories

### Project Identity
- **name**: Project name
- **symbol**: Short identifier
- **nature**: Project type (e.g., "vscode-extension")
- **philosophy**: Core development principles

### Merge Strategy
- **priority**: Rule precedence (higher = more important)
- **phase_0_rule**: Initial merge approach
- **hybrid_pattern**: Merge pattern selection
- **logic_based_3way**: 3-way merge strategy
- **reference**: Reference documentation

### Architecture Rules
- **modification_levels**: L1 (independent), L2 (conditional), L3 (direct)
- **protection_rules**: Protected directories, required comments, max changes

## How to Update

1. Edit `.agents/context/agents-rules.json` for AI rules
2. Update this file to explain changes for humans
3. Keep both files in sync

## Example Rule

```json
{
  "project_identity": {
    "name": "My Project",
    "symbol": "MP",
    "nature": "web-application",
    "philosophy": "Clean code, test-driven development"
  }
}
```
