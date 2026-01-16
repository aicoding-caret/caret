# Agents Standard Initialization

**IMPORTANT: Execute these steps NOW. Do not wait for user confirmation.**

Your task is to fully populate the `.agents/` and `.users/` directories with real project context. The template files have been created - you must now fill them with actual project data.

## STEP 1: Project Investigation (Execute Immediately)

Read these files to understand the project:
1. `README.md` or any project documentation
2. `package.json`, `Cargo.toml`, `go.mod`, or similar manifest files
3. Existing source code structure (use `ls` or file listing)
4. Any existing configuration files

## STEP 2: Fill agents-rules.json

Edit `.agents/context/agents-rules.json` with actual project data:
- `project_identity.name`: Real project name
- `project_identity.nature`: What the project does
- `project_identity.philosophy`: Development principles
- `architecture_rules`: Protected directories, modification rules
- `workflows.index`: Relevant workflows for this project

## STEP 3: Fill agents-rules.md

Edit `.users/context/agents-rules.md` with human-readable explanation:
- Detailed project description (in team's native language)
- Development guidelines and conventions
- Architecture decisions and rationale

## STEP 4: Update AGENTS.md and CLAUDE.md

Update both files to be proper entry points:
- Brief project overview
- Required files to read (point to agents-rules.json)
- Key commands and operations

## STEP 5: Fill ai-work-index.yaml

Edit `.agents/context/ai-work-index.yaml` with:
- Work categories relevant to this project
- Workflow references
- Keyword mappings

## Directory Structure Reference

```
.agents/                    # AI-optimized (English, token-efficient)
├── context/
│   ├── agents-rules.json   # ← Fill with project rules (SoT)
│   └── ai-work-index.yaml  # ← Fill with work categories
├── workflows/
│   └── atoms/
├── skills/
└── hooks/

.users/                     # Human-readable (native language)
├── context/
│   ├── agents-rules.md     # ← Fill with detailed explanation
│   └── ai-work-index.md
├── workflows/
├── skills/
└── hooks/

AGENTS.md                   # ← Update as entry point
CLAUDE.md                   # ← Update as entry point (same as AGENTS.md)
```

## Constraints

- Do NOT invent facts - only use confirmed sources from the project
- `.agents/` content in English (token-optimized)
- `.users/` content in team's native language (detailed)
- 1:1 mirroring: `.users/` structure mirrors `.agents/` exactly
- `AGENTS.md` and `CLAUDE.md` must have identical content
- If data is missing or unclear, ASK the user before writing

## Migration Note

If existing `AGENTS.md` or `CLAUDE.md` files were detected with legacy content,
migration guidance will be appended below. In that case:
1. Extract rules from existing files
2. Migrate to `.agents/context/agents-rules.json` (JSON format)
3. Migrate detailed explanations to `.users/context/agents-rules.md`
4. Update AGENTS.md/CLAUDE.md to be entry points only

**START EXECUTION NOW - Begin with Step 1: Read the project files.**
