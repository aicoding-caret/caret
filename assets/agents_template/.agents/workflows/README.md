# Workflows

Task workflows and protocols for AI agents.

## Structure

- `*.md` - Complete task workflows with clear start/end points
- `atoms/` - Reusable small protocols (building blocks)

## Workflows vs Atoms

| Workflows | Atoms |
|-----------|-------|
| Complete task flows | Reusable building blocks |
| Start-to-finish processes | Referenced by workflows |
| Example: `code-review-flow.md` | Example: `atoms/lint-check.md` |

## Usage

### Workflow Example
```markdown
# Feature Implementation Workflow

## Step 1: Requirements Analysis
...

## Step 2: Implementation
...

## Step 3: Quality Check
Apply atom: `@atoms/code-review.md`
Apply atom: `@atoms/test-validation.md`

## Step 4: Completion
...
```

### Atom Example (`atoms/code-review.md`)
```markdown
# Code Review Atom

A reusable protocol for code review.

1. Check code style consistency
2. Verify error handling
3. Review security implications
4. Validate test coverage
```

## Files

- `agents-init.md` - Project initialization workflow (runs after `/init`)
