# Lunova Frontend (`frontend`)

Next.js frontend for the Lunova Proposal Response Agent.

**Primary Owner**: Lokesh (with Chinmay contributing to `features/intelligence`)

## Technology Stack

- Next.js (App Router)
- TypeScript
- TanStack Query
- Tailwind CSS
- shadcn/ui

## Feature Ownership

| Feature Directory | Owner | Responsibilities |
| :--- | :--- | :--- |
| `features/proposals/` | **Lokesh** | Proposal list, status badges, proposal overview card |
| `features/review/` | **Lokesh** | Human review workflow, response editor, approve/edit/reject actions |
| `features/company/` | **Lokesh** | Company identity view, tenant configuration (MVP: Lunetron) |
| `features/knowledge/` | **Lokesh** | Document upload, catalog viewer, indexing status |
| `features/intelligence/` | **Shared** | Visual representation of AI results, requirement cards, citation chips, confidence meter (underlying AI owned by Chinmay) |

## Directory Structure

- `app/`: Next.js App Router (root layout, status page)
- `components/ui/`: Atomic UI primitives (buttons, dialogs, inputs)
- `components/shared/`: Layout shell, headers, navigation
- `features/`: Feature-oriented modules
- `hooks/`: Custom React hooks
- `lib/`: Utility helpers
- `services/`: API client services communicating with `backend/`
- `types/`: Frontend TypeScript type definitions
- `public/`: Static assets
