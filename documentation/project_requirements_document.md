# Project Requirements Document (PRD)

## 1. Project Overview

SailIQ is an AI-powered sailing video analysis and coaching platform built on the `sailiq-codeguide-starter` template. Its main goal is to let sailors, coaches, and club admins upload GoPro sailing footage, run automated AI-driven telemetry and manoeuvre analysis, and then visualize results in interactive dashboards. By leveraging a modern SaaS foundation—complete with authentication, storage, payments, and a polished UI—SailIQ frees developers from boilerplate work so they can focus on advanced video processing and coaching intelligence.

We’re building SailIQ to solve two core problems: first, to automate the tedious task of parsing sailing video and extracting performance metrics; second, to provide on-the-fly, context-aware coaching tips through a Retrieval-Augmented Generation (RAG) chat interface. Success for the initial release means users can sign up, pay via subscription, securely upload videos, see detailed performance charts, and ask coaching questions—each with a smooth, responsive experience.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1)**
- Multi-role user authentication and session management (Sailors, Coaches, Club Admins).
- Secure video upload to Supabase Storage via presigned URLs.
- Invocation of an external Python/FastAPI video analysis service.
- Storage of analysis results (manoeuvres, telemetry) in Supabase PostgreSQL.
- Interactive dashboards with React Query and a charting library (e.g., Recharts).
- RAG-powered chat interface querying Supabase Vector (pgvector + LangChain).
- Subscription payment flows and webhooks via Stripe.
- Responsive UI built with Tailwind CSS and shadcn/ui.

**Out-of-Scope (Planned Later)**
- Native mobile app or offline support.
- Advanced ML model training console or custom model uploads.
- Push notifications or real-time video streaming.
- Club-level bulk analytics beyond basic admin panels.
- Multi-boat live telemetry tracking.

## 3. User Flow

A new user (Sailor) lands on the public homepage, clicks “Sign Up,” and registers via Clerk’s email/password flow or OAuth. After verifying their email, they log in to the dashboard, which shows their profile, subscription status, and a left-hand nav with options: Upload Session, My Sessions, and Chat Coach. They click “Upload Session,” fill in metadata (boat class, location, wind conditions), and select a GoPro video. The frontend requests a secure upload URL from a Next.js API route, sends the video directly to Supabase Storage, then calls another API route to trigger the Python analysis service.

Within minutes, the Sailor returns to “My Sessions” where React Query polls the analysis status. Once processing completes, a detailed metrics page appears, showing manoeuvre timings, speed graphs, and heatmaps. The user can toggle data views, filter by date or wind condition, and click “Chat Coach” to open a chat widget. Their questions (e.g., “How can I improve my tacking angle?”) are sent via an API route that queries Vector embeddings and returns AI-generated coaching tips in real time.

## 4. Core Features

- **Authentication & Authorization**: Clerk-powered sign-up/sign-in, session handling, role-based access controls (Sailor, Coach, Club Admin).
- **Video Upload**: Secure presigned URL generation and direct upload to Supabase Storage.
- **Analysis Orchestration**: Next.js API routes to enqueue and trigger an external Python/FastAPI service for video processing (OpenCV, MoviePy).
- **Data Persistence**: Supabase PostgreSQL for structured session and performance data; supabase-admin client for server-side writes.
- **Interactive Dashboards**: React Query for data fetching and caching; charting via Recharts (or equivalent) for telemetry visualization.
- **RAG Chat**: LangChain integration querying pgvector embeddings in Supabase for context-aware coaching responses.
- **Payment & Subscriptions**: Stripe integration for plan management, trials, webhooks, and subscription sync.
- **Responsive UI**: Tailwind CSS + shadcn/ui for rapid, mobile-first component composition.

## 5. Tech Stack & Tools

- **Frontend**: Next.js 14 (App Router), React, TypeScript.
- **Styling & UI**: Tailwind CSS, shadcn/ui component library.
- **Authentication**: Clerk.
- **Database & Storage**: Supabase (PostgreSQL, Storage, pgvector extension).
- **Serverless APIs**: Next.js API routes.
- **Background Jobs (future)**: Inngest or BullMQ (for long-running analysis).
- **Video Analysis Service**: Python + FastAPI (OpenCV, MoviePy).
- **AI & Embeddings**: LangChain, pgvector, OpenAI GPT-4 (for chat responses).
- **Payments**: Stripe SDK, webhooks.
- **Data Fetching**: TanStack React Query.
- **Charting**: Recharts or Nivo.
- **IDE Integrations**: VSCode with Cursor plugin (optional).

## 6. Non-Functional Requirements

- **Performance**: Frontend pages should load within 1s on a 3G connection; API responses <300 ms (except analysis triggers).
- **Scalability**: Support 100 concurrent users uploading and viewing sessions; horizontal scaling of Next.js and analysis service.
- **Security & Compliance**: HTTPS everywhere; JWT/session cookies; GDPR-compliant data handling; encryption at rest for video files.
- **Availability**: 99.9% uptime for core user flows; retries/backoffs on transient API errors.
- **Usability**: Mobile-responsive layout; accessible components (WCAG 2.1 AA).

## 7. Constraints & Assumptions

- Supabase must have the pgvector extension enabled for RAG features.
- External Python/FastAPI service must be hosted separately (e.g., on Docker/Vercel Edge Functions) and reachable by Next.js.
- Stripe webhooks require a public endpoint and secure secret storage via environment variables.
- Video analysis can take up to 5 minutes; React Query will poll status without blocking UI.
- Team assumes availability of OpenAI GPT-4 for coaching responses; fallback to GPT-3.5 if rate-limited.

## 8. Known Issues & Potential Pitfalls

- **Long-Running Video Jobs**: Vercel serverless functions may time out—plan a background queue (Inngest/BullMQ).
- **Large File Uploads**: Browser memory limits; ensure chunked uploads or direct-to-storage streaming.
- **API Rate Limits**: OpenAI and Supabase may throttle—implement exponential backoff and caching.
- **Data Consistency**: Out-of-order webhook events from Stripe—use idempotent webhook handlers.
- **Vector Search Accuracy**: Embedding drift as coaching docs change—schedule nightly re-indexing of manuals.
- **Cross-Origin Issues**: Ensure CORS is configured on Next.js API and Supabase storage.

---

This PRD provides a clear blueprint for SailIQ’s MVP. It outlines what to build now, what to defer, how users will navigate the system, and the exact technologies and integrations needed—leaving no ambiguity for the engineering or AI documentation that follows.