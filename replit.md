# WhatsApp AI Chatbot Admin Dashboard

## Overview

This is a full-stack web application that provides an admin dashboard for managing a WhatsApp AI chatbot system. The application allows administrators to upload and manage documents for a knowledge base, view chat messages and analytics, and configure chatbot settings. The system uses AI embeddings to create a searchable knowledge base from uploaded documents and provides analytics on chatbot interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Library**: Radix UI components with shadcn/ui styling system for consistent, accessible interface components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **File Processing**: Multer for file upload handling with support for PDF, DOCX, and TXT files
- **AI Integration**: OpenAI API for embeddings generation and chat completions using GPT-4

### Database & ORM
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: Users, documents, chunks (for embeddings), messages, and sessions

### Authentication & Session Management
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: HTTP-only cookies with secure flags and CSRF protection

### Document Processing Pipeline
- **File Upload**: Multi-format support (PDF, DOCX, TXT) with file type validation
- **Text Extraction**: Content parsing from various document formats
- **Chunking Strategy**: Text segmentation with configurable chunk size and overlap
- **Embeddings**: OpenAI text-embedding-ada-002 model for vector generation
- **Storage**: Chunked text and embeddings stored in PostgreSQL

### Real-time Features
- **Development**: Vite HMR for instant feedback during development
- **Error Handling**: Runtime error overlay in development mode
- **Logging**: Structured request/response logging with performance metrics

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **OpenAI API**: GPT-4 for chat completions and text-embedding-ada-002 for embeddings
- **Replit Auth**: Authentication service with OpenID Connect integration

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **Replit Integration**: Development environment with cartographer and error modal plugins
- **TypeScript**: Static type checking across frontend and backend

### UI Components & Styling
- **Radix UI**: Headless component library for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Chart library for analytics visualization

### File Processing
- **Multer**: Multipart form data handling for file uploads
- **File Type Support**: PDF, DOCX, and plain text document processing

### State & Data Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition