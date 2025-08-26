# Overview

This is a New Employee Onboarding Web Application built for C&W Korea. It's a mobile-first web application designed to streamline the onboarding process for new employees. The system features a dual-interface architecture with an admin panel for managing employee accounts and onboarding content, and a user dashboard for new employees to access their onboarding materials and information.

The application provides administrators with tools to create and manage employee accounts, upload and organize educational content (videos, PDFs, images, and links), and track the onboarding process. New employees can log in to view their assigned buddy information, locker details, laptop information, and access interactive learning modules through an icon-based interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript and follows a component-based architecture. It uses Vite as the build tool and development server, providing fast hot-reload capabilities. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, ensuring accessibility and consistent design patterns.

The application implements client-side routing using Wouter, a lightweight routing library. State management is handled through React Query (TanStack Query) for server state and React Context for authentication state. The design system is built with Tailwind CSS, configured with custom design tokens and CSS variables for theming.

Key frontend patterns include:
- Protected routes that require authentication
- Form validation using React Hook Form with Zod schemas
- Toast notifications for user feedback
- Mobile-first responsive design
- File upload handling with preview capabilities

## Backend Architecture
The backend follows a Node.js/Express.js REST API architecture with TypeScript. It implements a modular structure separating concerns between authentication, routing, storage, and database operations.

The server uses middleware for:
- Request logging and timing
- JSON and URL-encoded body parsing
- Session management with PostgreSQL session store
- Authentication via Passport.js with local strategy
- File upload handling with Multer

API endpoints are organized around resource-based REST principles for employees and content management. The authentication system uses session-based authentication with encrypted password storage using Node.js crypto scrypt function.

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes three main tables:
- `admins` - for administrator accounts
- `employees` - for new employee information and credentials
- `content_icons` - for onboarding educational content

Database migrations are managed through Drizzle Kit, and the connection is established using Neon's serverless PostgreSQL driver. Session data is stored in PostgreSQL using connect-pg-simple for persistent session management.

The schema design ensures data integrity with proper constraints, UUID primary keys, and timestamps for audit trails. File uploads are stored in the local filesystem with references stored in the database.

## Authentication and Authorization
The authentication system implements a dual-user model supporting both admin users and employee users with different login flows. Admin authentication uses username/password combinations with encrypted password storage, while employee authentication uses their Korean name as username and the last 4 digits of their phone number as password.

Session management is handled through Express sessions with PostgreSQL storage, ensuring sessions persist across server restarts. The system includes:
- Password hashing using scrypt with salt
- Session-based authentication (no JWT)
- Protected route middleware
- Role-based access control (admin vs employee views)
- Session timeout and security configurations

## External Dependencies
The application integrates with several key external services and libraries:

**Database & ORM:**
- Neon PostgreSQL for cloud database hosting
- Drizzle ORM for type-safe database queries
- connect-pg-simple for PostgreSQL session storage

**UI & Styling:**
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- shadcn/ui for pre-built component library

**Development & Build Tools:**
- Vite for fast development and optimized builds
- TypeScript for type safety across the stack
- ESBuild for efficient server-side bundling
- Replit-specific plugins for development environment integration

**Authentication & Security:**
- Passport.js for authentication strategy management
- Express sessions for session management
- Node.js crypto module for password hashing

**File Handling:**
- Multer for multipart form data and file uploads
- File system storage for uploaded content
- MIME type validation for security

The architecture supports content delivery through multiple formats (video embeds, image display, PDF links, external links) and provides a scalable foundation for additional onboarding features.