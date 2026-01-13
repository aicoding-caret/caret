# README

This directory contains user-provided context for AI agents.

## Purpose
Separate user context (markdown, human-readable) from system rules (JSON/YAML).

## Files
- `project-context.md` - Main project context and information
- You can add more `.md` files as needed

## Guidelines
- Write in **English** for token optimization
- Use **Markdown** format for readability
- Keep content concise and relevant
- Update context when project structure changes

## Example Usage
```bash
# After /init, edit the project context
cat .agents/context-for-user/project-context.md

# Add more context files
echo "# Custom Context" > .agents/context-for-user/custom-context.md
```
