# AI Work Index

Human-readable guide for `.agents/context/ai-work-index.yaml`.

## Purpose

The `ai-work-index.yaml` file serves as an index for AI workflows and categories.
It helps AI agents discover and load relevant workflows on demand.

## Structure

```yaml
version: 1
categories:
  - name: "category-name"
    workflows:
      - "workflow-file.md"
notes:
  - Additional notes for AI
```

## Usage

1. Add workflow categories as your project grows
2. Reference workflow files in `.agents/workflows/`
3. AI will use this index to find relevant workflows

## Example

```yaml
version: 1
categories:
  - name: "development"
    workflows:
      - "feature-development.md"
      - "code-review.md"
  - name: "testing"
    workflows:
      - "test-workflow.md"
```
