# Task Manager — Frontend (React + Vite)

The React frontend for Task Manager. User authentication, project management, and task tracking.

**Live app:** https://taskmanagerapp-tau.vercel.app/

## Tech Stack

- **React 18** — components with hooks (`useState`, `useEffect`, `useCallback`)
- **Vite 5** — build tool and dev server
- **React Router v6** — client-side routing
- **Vanilla CSS via inline styles** — no CSS framework; each component owns its styles
- **Fetch API** — HTTP requests to the Spring Boot backend

## Development

```bash
cd frontend/react
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8080`.

## Environment Variables

| Variable      | Default (dev)         | Description                                       |
|---------------|-----------------------|---------------------------------------------------|
| `VITE_API_URL` | `http://localhost:8080` | Backend API base URL. In production, set to the deployed API URL. |

## Pages

- `/login` — Sign in with username and password
- `/register` — Create a new account
- `/dashboard` — Main dashboard; create new projects
- `/projects` — List of all projects owned by the current user
- `/projects/:id` — Project detail: view and manage tasks

## Features

- User registration and login with JWT authentication
- Project CRUD (create, list, update name/description, delete)
- Task CRUD within a project (create, list, update status/description, delete)
- Task status workflow: To Do → In Progress → Done
- Protected routes: unauthenticated users are redirected to login

## API Calls

The frontend calls these backend endpoints:

- `POST /api/auth/register` — register
- `POST /api/auth/login` — login
- `POST /api/projects` — create project
- `GET /api/projects` — list projects
- `PATCH /api/projects/{id}` — update project
- `DELETE /api/projects/{id}` — delete project
- `POST /api/tasks` — create task
- `GET /api/tasks/project/{projectId}` — list tasks in a project
- `PATCH /api/tasks/{id}` — update task
- `DELETE /api/tasks/{id}` — delete task

## State

Authentication state is stored in an `AuthContext` (React context). User info and the JWT token are stored in `localStorage`. API calls use the Fetch API directly inside each page component (see `src/pages/*.jsx` and `src/context/AuthContext.jsx`).
