# User Context

Human-readable project context that mirrors `.agents/context/`.

## Purpose

Provide detailed explanations of the rules in `.agents/context/` for human developers.
While `.agents/context/` contains token-optimized rules for AI, this directory contains
comprehensive guides in your team's native language.

## Mirroring Pattern

| .agents/context/ (AI) | .users/context/ (Human) |
|----------------------|--------------------------|
| `agents-rules.json` | `agents-rules.md` (detailed) |
| `testing.yaml` | `testing.md` (guide) |
| `architecture.yaml` | `architecture.md` (guide) |

## Guidelines

- **Language**: Your team's native language (Korean, Japanese, etc.)
- **Format**: Detailed Markdown with examples
- **Content**: Background, rationale, examples, diagrams
- **NOT token-optimized**: Write as much detail as needed

## Files

- `project-context.md.template` - Template for project context (rename to `.md` and fill in)
