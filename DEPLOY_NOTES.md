# Deploy Notes — Task Manager

Verified state (2026-09-05):
- GitHub repo: FrozenProduction/task-manager (main branch)
- Backend: Spring Boot 3.2.4 (Java 17), JWT auth, PostgreSQL/H2, Swagger
- Frontend: React 18 + Vite + Router v6, inline CSS
- Live backend: https://task-manager-api-oej2.onrender.com/ (free tier — sleeps after 15 min)
- Live frontend: https://taskmanagerapp-tau.vercel.app/ (Vercel — auto-deploy from main)
- DB: Render PostgreSQL `task-manager-db` (free plan — expires after 90 days of inactivity)
- CI: GitHub Actions `.github/workflows/test.yml` (build + integration tests)
- Screenshot: docs/screenshots/login.png (verified real login form)
- Security: no secrets committed; .env / application-prod.properties in .gitignore; JWT_SECRET only in Render env
- Model policy: minimax/minimax-m3:free (default), inkling-small:free fallback only on M3 hard error
- Config backups cleaned (10 → 3 kept in /opt/data/config.yaml.bak.*)
- All README edits applied (Java 17, live URLs, DB_HOST/DB_PORT/DB_NAME env vars, CORS)
