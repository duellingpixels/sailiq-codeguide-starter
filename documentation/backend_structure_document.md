# Backend Structure Document

This document outlines the backend architecture, database design, API structure, hosting environment, infrastructure components, security measures, and monitoring strategy for the SailIQ application built on the `sailiq-codeguide-starter` template. It is written in everyday language to ensure clarity for technical and non-technical readers alike.

## 1. Backend Architecture

**Overall Design**
- We use Next.js 14 with the App Router as our main backend framework. It lets us create serverless API routes alongside our React pages.
- Authentication and user roles are handled by Clerk. We define three main roles: Sailor, Coach, and Club Admin.
- The core data store is Supabase, which provides PostgreSQL for structured data, object storage for video files, and optional pgvector for vector search.
- Stripe handles subscription billing and payments, with secure webhook routes running in Next.js.
- A separate Python analysis service (built with FastAPI or NestJS) processes uploaded sailing videos, extracts telemetry, and writes results back to the database.

**Scalability, Maintainability, Performance**
- Serverless functions on Vercel (where Next.js runs) automatically scale with traffic—no servers to manage.
- Clear separation of concerns: Next.js for orchestration and user-facing APIs, Python service for heavy video processing and ML tasks.
- Supabase edge and database scaling make it easy to grow without manual sharding.
- Modular code structure (`app/`, `components/`, `utils/`, `services/`) simplifies feature additions and maintenance.

## 2. Database Management

**Technologies Used**
- SQL database: PostgreSQL (via Supabase).
- File storage: Supabase Storage for large video files.
- Vector search: pgvector extension in Supabase for RAG-powered chat embeddings.

**Data Structure and Access**
- User profiles, roles, and session metadata (boat class, wind conditions) live in PostgreSQL tables.
- Video files upload directly to Supabase Storage; only URLs and metadata are stored in the database.
- Analysis results (manoeuvre times, speed metrics) are inserted by the Python service using a secure Supabase admin client.
- pgvector stores document embeddings for coaching manuals; queried by the LangChain RAG system.
- Real-time subscriptions (via Supabase’s real-time feature) keep dashboards up to date.

**Best Practices**
- Row-Level Security (RLS) in PostgreSQL ensures that users only see their own data.
- Use environment variables to store keys for Supabase, Clerk, Stripe, and the OpenWeatherMap API.
- Regular backups and automated migrations managed through Supabase’s tools.

## 3. Database Schema

Below is a human-friendly description, followed by SQL table definitions for PostgreSQL.

**Tables and Relationships**
- Users: stores Clerk user IDs, roles, and profile data.
- Sessions: metadata for each sailing session (date, location, boat class, conditions).
- Manoeuvres: detailed breakdown of each maneuver within a session.
- PerformanceMetrics: quantitative results extracted by the analysis service (speed, angle, etc.).
- Embeddings: stores vector representations of coaching documents with references.
- StripeCustomers and Subscriptions: link users to Stripe billing records.

**SQL Schema (PostgreSQL)**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sailor', 'coach', 'club_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location TEXT,
  boat_class TEXT,
  wind_conditions TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manoeuvres table
CREATE TABLE manoeuvres (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time INTERVAL,
  end_time INTERVAL
);

-- PerformanceMetrics table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  manoeuvre_id UUID REFERENCES manoeuvres(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  unit TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings table (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  document_id UUID,
  embedding vector(1536),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe customers linkage
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  stripe_customer_id TEXT REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. API Design and Endpoints

We use Next.js App Router’s serverless routes. All endpoints live under `app/api/`.

**Key Endpoints**
- **POST /api/upload**
  - Purpose: Generate a signed URL for direct video uploads to Supabase Storage.
  - Input: Session metadata (user ID, date).
  - Response: `uploadUrl`, `fileKey`.

- **POST /api/analyze**
  - Purpose: Trigger the Python analysis service once a video is uploaded.
  - Input: `fileKey`, `sessionId`.
  - Workflow: Enqueues a background job or sends an HTTP request to the analysis service.

- **GET /api/sessions**
  - Purpose: List all sessions for the authenticated user.
  - Response: Array of sessions with summary data.

- **GET /api/sessions/[id]**
  - Purpose: Fetch detailed data, including manoeuvres and metrics, for one session.

- **POST /api/chat**
  - Purpose: Handle RAG chat queries for coaching tips.
  - Input: `question`, optional `sessionId`.
  - Workflow: Uses LangChain to query `embeddings` and returns an answer.

- **POST /api/webhooks/stripe**
  - Purpose: Receive Stripe webhook events (invoices paid, subscription changes).
  - Security: Verifies signature header.
  - Workflow: Updates `subscriptions` table accordingly.

## 5. Hosting Solutions

**Next.js and API Routes**
- Hosted on Vercel as serverless functions. Vercel provides a global CDN, instant scaling, and built-in HTTPS.

**Supabase**
- Managed cloud hosting for PostgreSQL, storage, and edge functions. Offers automatic scaling, daily backups, and real-time features.

**Python Analysis Service**
- Can be hosted on a separate cloud service (AWS Fargate, Heroku, or DigitalOcean App Platform).
- Containerized with Docker for consistent deployment.

**Stripe**
- Runs on Stripe’s infrastructure; we only manage webhook endpoints.

## 6. Infrastructure Components

- **Load Balancer & CDN**: Vercel’s platform automatically load balances requests across regions and caches static assets.
- **Caching**: Next.js built-in caching for server components, TanStack React Query on the client to cache API results.
- **Background Jobs**: Use Inngest or BullMQ (hosted separately) to manage long-running analysis tasks.
- **Content Delivery**: Supabase Storage leverages a CDN for fast video delivery.
- **Vector Search Index**: pgvector serves as an in-database index for RAG queries.

## 7. Security Measures

- **Authentication**: Clerk handles secure sign-up/sign-in flows, multi-factor if enabled, and session management.
- **Authorization**: Role-based checks in API middleware to restrict access to Sailor, Coach, or Admin features.
- **Database Security**: Row-Level Security (RLS) rules in PostgreSQL ensure users cannot read others’ data.
- **Data Encryption**: All data in transit is encrypted via HTTPS/TLS. Supabase encrypts data at rest by default.
- **Environment Variables**: Secrets (API keys, DB URLs) never checked into code—managed via Vercel and Supabase dashboards.
- **Webhook Verification**: Stripe events verified using the official signing secret.

## 8. Monitoring and Maintenance

- **Performance Monitoring**: Vercel Analytics for serverless function latencies, Supabase Metrics for database query performance.
- **Error Tracking**: Integrate Sentry or Datadog for capturing runtime errors in Next.js functions and the Python service.
- **Logging**: Structured logs in Vercel, plus custom logs in the Python service output to a logging platform.
- **Automated Backups & Migrations**: Supabase’s built-in backup schedules and migration scripts managed via Git.
- **Dependency Updates**: Use Dependabot or Renovate to keep npm packages and Docker images up to date.

## 9. Conclusion and Overall Backend Summary

The SailIQ backend leverages modern, serverless-first technologies to deliver a scalable, maintainable, and high-performance platform. Key highlights:

- A unified serverless Next.js layer for user-facing APIs and orchestration.
- Supabase as a single provider for relational data, file storage, real-time updates, and vector search.
- Clerk and Stripe integrations handling security and billing out of the box.
- A dedicated Python analysis service for heavy video processing and AI tasks, decoupled from the frontend stack.

This structure allows the SailIQ team to focus on building the unique AI-driven video coaching features, confident that the foundational backend is robust, secure, and ready to scale as the platform grows.