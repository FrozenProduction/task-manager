# Task Manager — Backend API (Spring Boot)

The backend for Task Manager. Handles user authentication (JWT), projects, and tasks.

## API Endpoints

### Authentication (public)

| Method | Path              | Description                         |
|--------|-------------------|-------------------------------------|
| POST   | `/api/auth/register` | Register a new user              |
| POST   | `/api/auth/login`    | Login and receive a JWT token    |

### Projects (authenticated)

| Method | Path              | Description                         |
|--------|-------------------|-------------------------------------|
| POST   | `/api/projects`   | Create a project                    |
| GET    | `/api/projects`   | List projects owned by the user    |
| GET    | `/api/projects/{id}` | Get a project                     |
| PATCH  | `/api/projects/{id}` | Update a project                  |
| DELETE | `/api/projects/{id}` | Delete a project                  |

### Tasks (authenticated)

| Method | Path                  | Description                     |
|--------|-----------------------|---------------------------------|
| POST   | `/api/tasks`          | Create a task                   |
| GET    | `/api/tasks/project/{projectId}` | List tasks in a project |
| GET    | `/api/tasks/assigned` | List tasks assigned to the user |
| GET    | `/api/tasks/{id}`     | Get a task                      |
| PATCH  | `/api/tasks/{id}`     | Update a task                   |
| DELETE | `/api/tasks/{id}`     | Delete a task                   |

## Technologies

- **Spring Boot 3.2** — framework for the REST API
- **Spring Security** — authentication and authorization layer
- **JWT (JJWT 0.12)** — token-based authentication
- **Spring Data JPA** — database access layer
- **PostgreSQL** — production database
- **H2** — in-memory database for local development
- **Swagger (springdoc-openapi)** — auto-generated API documentation

## Environment Variables (Production)

| Variable              | Description                                    |
|-----------------------|------------------------------------------------|
| `DB_HOST`              | PostgreSQL host (e.g. `dpg-xxxx-a`)               |
| `DB_PORT`              | PostgreSQL port (default `5432`)                  |
| `DB_NAME`              | PostgreSQL database name                          |
| `DB_USERNAME`          | Database username                                 |
| `DB_PASSWORD`          | Database password                                 |
| `JWT_SECRET`           | Secret key for signing JWT tokens (min 32 chars recommended) |
| `JWT_EXPIRATION_MS`    | Token expiration in milliseconds (default: 86400000 = 24h) |
| `SPRING_PROFILES_ACTIVE` | Set to `prod` for PostgreSQL, `local` for H2 (default) |

## Running Locally

```bash
cd backend/spring-boot
./mvnw spring-boot:run
```

API at `http://localhost:8080`. Swagger UI at `http://localhost:8080/swagger-ui.html`.

### Testing with H2 (default)

No environment variables needed. The app uses H2 in-memory with the `local` profile.

### Testing with PostgreSQL

Set `SPRING_PROFILES_ACTIVE=prod` and provide the database credentials.

## Security Notes

- All endpoints except `/api/auth/**` require a valid JWT token.
- The token is sent in the `Authorization` request header.
- Passwords are hashed with BCrypt before storage.
- CORS is configured to allow the frontend origin(s).
