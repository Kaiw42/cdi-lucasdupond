# EduLinux - Virtual Linux Educational Platform

## Overview

EduLinux is a web-based virtual Linux desktop environment designed for French educational settings (collège level). The platform simulates a professional desktop operating system experience where teachers can manage virtual student workstations, share documents, and broadcast their screen to students across different grade levels (6e, 5e, 4e, 3e).

The application provides two distinct interfaces:
- **Student Desktop**: A simulated Linux desktop with applications (text editor, calculator, browser, file manager, notes)
- **Teacher Dashboard**: A management interface for monitoring students, sharing files, and screen broadcasting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool

**Routing**: Wouter for lightweight client-side routing

**State Management**: TanStack Query (React Query) for server state management with a custom query client configuration that handles authentication errors

**UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling. The design follows a Linux desktop inspiration with Material Design principles adapted for an educational environment.

**Design System**: 
- Dark/light theme support via ThemeProvider
- Custom CSS variables for consistent theming
- Inter font for UI, JetBrains Mono for code elements
- Tailwind spacing units: 1, 2, 4, 6, 8

**Key Frontend Patterns**:
- Role-based rendering (teacher vs student views in Home component)
- Window management system for desktop simulation
- Taskbar component for application switching

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API with `/api` prefix for all endpoints

**Authentication**: Replit Auth (OpenID Connect) with Passport.js integration. Session management uses PostgreSQL-backed sessions via connect-pg-simple.

**Authorization**: Role-based access control with teacher emails configured via `TEACHER_EMAILS` environment variable. Middleware functions (`isAuthenticated`, `isTeacher`) protect routes.

**Key Server Patterns**:
- Storage abstraction layer (`storage.ts`) for all database operations
- Centralized route registration in `routes.ts`
- Development/production mode detection for Vite middleware vs static serving

### Data Storage

**Database**: PostgreSQL with Drizzle ORM

**Schema Design** (in `shared/schema.ts`):
- `sessions`: OpenID Connect session storage
- `users`: User accounts with role (student/teacher), class assignment, online status
- `sharedFiles`: Teacher-shared documents with class targeting
- `studentFiles`: Per-student file storage
- `studentNotes`: Per-student note-taking
- `screenSharing`: Teacher screen broadcast state

**Validation**: Zod schemas via drizzle-zod for type-safe validation

### Build System

**Development**: Vite dev server with HMR, proxied through Express
**Production**: 
- Client: Vite builds to `dist/public`
- Server: esbuild bundles to `dist/index.cjs` with selective dependency bundling for faster cold starts

## External Dependencies

### Core Services
- **PostgreSQL Database**: Required for user data, sessions, and file storage. Connection via `DATABASE_URL` environment variable.
- **Replit Auth (OIDC)**: Authentication provider using `ISSUER_URL` (defaults to `https://replit.com/oidc`) and `REPL_ID` for OAuth flow.

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit deployment identifier
- `TEACHER_EMAILS`: Comma-separated list of emails with teacher privileges

### Third-Party Libraries
- **@tanstack/react-query**: Server state management
- **drizzle-orm** + **drizzle-kit**: Database ORM and migrations
- **passport** + **openid-client**: Authentication
- **express-session** + **connect-pg-simple**: Session management
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library