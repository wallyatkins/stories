# BMAD Method for Stories

This project uses **BMAD Method v6.11.0** with the core BMad Method module (BMM) installed.

## Layout
- Project skills live in `.agents/skills/`.
- Planning and implementation artifacts belong in `_bmad-output/`.
- Project documentation is maintained in `docs/`.

## Key Workflows
Start each major workflow from the project root using the relevant skill:

- `bmad-help` – View the catalog of available skills and commands.
- `bmad-project-context` – Review current application architecture and deployment context.
- `bmad-prd` / `bmad-product-brief` – Define new features, user journeys, or prompt experiences.
- `bmad-create-architecture` – Architect changes across frontend (React/Vite), backend (PHP), and database (PostgreSQL).
- `bmad-create-story` and `bmad-build` – Execute implementation stories.
- `bmad-code-review` and `bmad-qa-generate-e2e-tests` – Review changes and generate test suites.

Keep planning decisions and implementation deliverables recorded in `_bmad-output/` so architectural context is preserved.
