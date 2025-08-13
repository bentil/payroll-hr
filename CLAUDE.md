# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
npm run start:dev    # Start development server with hot reload and auto-generated Swagger specs
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
```

### Database Operations
```bash
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema changes to database (development)
npm run db:migrate   # Create migration files for production
```

### Code Quality
```bash
npm run lint         # Run ESLint with auto-fix
npm test             # Run Jest tests
```

### API Documentation
```bash
npm run swagger      # Generate OpenAPI/Swagger specifications
# Swagger UI available at /docs endpoint in non-production environments
```

### Protocol Buffers (gRPC)
```bash
npm run proto:generate  # Generate protobuf files
npm run proto:clean     # Remove generated protobuf files
```

## Architecture Overview

### Tech Stack
- **Framework**: Express.js with TypeScript
- **Database**: MySQL with Prisma ORM (version locked to 5.4.x)
- **Message Queue**: Apache Kafka (KafkaJS)
- **API Documentation**: TSOA (TypeScript OpenAPI) with Swagger
- **Authentication**: JWT with permissions middleware
- **Validation**: Joi schemas for request validation

### Project Structure

The codebase follows a layered architecture pattern:

1. **Controllers** (`/src/controllers/`) - HTTP request handlers with TSOA decorators for API documentation
2. **Services** (`/src/services/`) - Business logic layer containing core application logic
3. **Repositories** (`/src/repositories/`) - Data access layer using Prisma ORM
4. **Domain** (`/src/domain/`) - DTOs, request schemas, and domain events

### Key Architectural Patterns

**Singleton Services**: Database and Kafka connections are managed as singletons in `/src/components/`:
- `Database.ts` - Prisma client singleton
- `Kafka.ts` - Kafka producer/consumer singleton

**Event-Driven Architecture**: Kafka consumers in `/src/consumers/` handle domain events for:
- Employee synchronization
- Leave request processing
- Reimbursement workflows
- Announcement distribution

**Request Flow**:
1. Routes (`/src/routes/`) define API endpoints
2. Middleware validates JWT tokens and permissions
3. Controllers handle HTTP requests with Joi validation
4. Services execute business logic
5. Repositories interact with database via Prisma

### Database Schema

The Prisma schema (`/prisma/schema.prisma`) defines extensive HR domain models including:
- Companies, Departments, Employees
- Leave requests with approval workflows
- Reimbursements and expense tracking
- Grievances and disciplinary actions
- Documents and announcements

### API Versioning

All API routes are versioned under `/v1/` prefix. The API structure follows RESTful conventions with consistent naming patterns.

### Environment Configuration

Configuration is managed through environment variables with defaults in `/src/config/`. Key configurations include:
- Database connection (MySQL)
- Kafka broker settings
- JWT authentication settings
- Service ports (default: 3010 for localhost, 3000 for container)

### Testing Approach

Tests use Jest framework. Run individual tests with:
```bash
npm test -- path/to/test.spec.ts
```

### Development Workflow

1. Start development server: `npm run start:dev`
2. API documentation auto-generates and is available at `http://localhost:3010/docs`
3. Nodemon watches for TypeScript changes in `/src` directory
4. Husky pre-commit hooks run linting on staged files

### Important Notes

- Prisma version is locked to 5.4.x to avoid breaking changes
- Always run `npm run db:generate` after modifying Prisma schema
- TSOA decorators in controllers automatically generate OpenAPI specs
- Kafka consumers must be properly initialized for event processing
- Use repository layer for all database operations to maintain separation of concerns