# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js/TypeScript HR and Payroll API service built with Express.js, Prisma ORM, and Kafka messaging. It follows a layered architecture pattern with controllers, services, and repositories.

## Essential Commands

### Development
```bash
# Install dependencies
npm install

# Generate Prisma client (required after schema changes)
npm run db:generate

# Run development server with hot reload and auto-swagger generation
npm run start:dev

# Run production build
npm run build
npm start

# Lint code
npm run lint

# Run tests
npm run test
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create migration files
npm run db:migrate
```

### API Documentation
```bash
# Generate OpenAPI/Swagger docs
npm run swagger
```

### Protocol Buffers
```bash
# Generate protobuf code
npm run proto:generate

# Clean and regenerate protobuf code
npm run proto:clean-generate
```

## Architecture Overview

### Layered Architecture Pattern
The codebase follows a strict layered architecture:
1. **Controllers** (`/src/controllers/`) - Handle HTTP requests and responses
   - Express controllers in `*.api.controller.ts`
   - TSOA OpenAPI controllers in `/openapi/*.oas.controller.ts`
2. **Services** (`/src/services/`) - Business logic layer
3. **Repositories** (`/src/repositories/`) - Data access layer using Prisma
4. **Domain** (`/src/domain/`) - DTOs, schemas, events, and domain models

### Key Architectural Components
- **Authentication**: Multi-level auth with API keys, user sessions, and platform users
- **Authorization**: Role-based (HR, OPERATIONS, EMPLOYEE) with granular permissions
- **Database**: MySQL with Prisma ORM, migrations in `/prisma/`
- **Event-Driven**: Kafka integration for inter-service communication
- **API Documentation**: Auto-generated Swagger via TSOA decorators

### Important Patterns
1. **Dual Controller Pattern**: Express routes call TSOA controllers for OpenAPI documentation
2. **Company Scoping**: All data is scoped to companies for multi-tenancy
3. **Error Handling**: Custom error classes in `/src/components/error/` with centralized middleware
4. **Validation**: Joi schemas in `/src/domain/request-schema/` for request validation
5. **Logging**: Winston logger with request tracing via cls-rtracer

### Core Business Domains
- Employee management and documents
- Leave management (types, packages, requests)
- Grievance and disciplinary systems
- Company structure (departments, job titles)
- Announcements
- Reimbursements
- Work time tracking

### Service Dependencies
The application integrates with external services via environment variables:
- Document service for file management
- Email service for notifications
- RPC service for gRPC communication
- Kafka for event messaging

When adding new features:
1. Follow the existing layered architecture pattern
2. Create DTOs in `/src/domain/dto/`
3. Add validation schemas in `/src/domain/request-schema/`
4. Implement service logic in `/src/services/`
5. Add repository methods in `/src/repositories/`
6. Create both Express and TSOA controllers
7. Ensure proper company scoping for multi-tenancy
8. Add appropriate authentication and authorization checks