# Backend Architecture Standards

## 1. Domain-Driven Design (DDD)
- **Separation of Concerns:** Keep business logic isolated from routing and database interactions. Group code by "Features" or "Domains" instead of technical roles (e.g., Controllers, Models).
- **Service Layer:** Introduce a robust Service layer between the API Controllers and Data Access layer to handle all core business operations.

## 2. API Design Principles
- **RESTful Best Practices:** Use standard HTTP verbs (GET, POST, PUT, PATCH, DELETE) and adhere to stateless interaction principles. Version APIs proactively (e.g., `/api/v1/resource`).
- **GraphQL:** When using GraphQL, restrict query depth to prevent complex query DOS attacks, and use DataLoader patterns to batch and cache database requests (resolving N+1 issues).
- **Pagination & Filtering:** Implement cursor-based pagination for large datasets (improves performance over offset pagination) and allow complex filtering through standardized query parameters.

## 3. Database Strategy
- **Relational Integrity:** Use strict schemas, constraints, and foreign keys in SQL databases (PostgreSQL/MySQL) to ensure data validity.
- **ORM / Query Builders:** Utilize modern tools like Prisma, Drizzle, or TypeORM for type-safe database interactions. Avoid raw queries unless optimizing critical bottlenecks.
- **Indexing:** Profile queries regularly using `EXPLAIN`. Index heavily queried columns (foreign keys, timestamps, searchable text) to dramatically improve read performance.

## 4. Error Handling & Monitoring
- **Standardized Error Responses:** Ensure all API errors return a consistent JSON format containing `code`, `message`, and `details` for easy client consumption.
- **Global Exception Filters:** Implement centralized error handling middleware to catch unhandled exceptions, format them properly, and log critical errors to monitoring tools like Sentry or Datadog.
- **Health Checks & Observability:** Expose `/health` endpoints and integrate APM (Application Performance Monitoring) to track endpoint latency and throughput.

## 5. Security & Availability
- **Authentication/Authorization Check:** Never trust user input. Validate permissions (JWT, sessions) at every endpoint. Avoid exposing internal Database IDs where UUIDs are more secure.
- **Scaling:** Design stateless applications that can scale horizontally behind load balancers. Store state in fast-access caches (Redis) instead of app memory.
