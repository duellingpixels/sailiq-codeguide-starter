# sailiq-codeguide-starter Tech Stack Document

This document explains the key technology choices behind the `sailiq-codeguide-starter` template, written in everyday terms. It shows how each tool and framework works together to build a data-heavy, AI-enabled SaaS platform for sailing video analysis and coaching.

## Frontend Technologies

- **Next.js 14 (App Router)**
  - A React-based framework that handles page routing, server-side rendering, and API routes in one place.
  - Server Components deliver data-heavy pages (like dashboards) directly from the server for faster initial loads.
- **TypeScript**
  - Adds type safety to JavaScript, reducing bugs by checking data shapes across frontend, backend, and database.
- **Tailwind CSS & shadcn/ui**
  - Tailwind gives a utility-first approach to styling, letting you build custom designs quickly.
  - shadcn/ui provides prebuilt, themeable React components (forms, buttons, modals) so you don’t start styling from scratch.
- **TanStack React Query**
  - Manages data fetching, caching, and synchronization with the server.
  - Automatically handles loading states and background updates, keeping dashboards snappy.
- **Recharts (or similar charting library)**
  - Used for drawing graphs, heatmaps, and trend lines to visualize sailing session metrics.
- **Clerk**
  - Handles user sign-up, sign-in, session management, and role-based metadata (Sailors, Coaches, Club Admins) without extra plumbing.

## Backend Technologies

- **Next.js API Routes**
  - Lightweight, serverless functions inside the same codebase that handle tasks like generating upload URLs and responding to chat queries.
- **Supabase**
  - **PostgreSQL Database** stores user profiles, session metadata (boat class, location, wind conditions), and AI analysis results.
  - **Supabase Storage** holds large video files (e.g., GoPro recordings) securely and at scale.
  - **pgvector Extension** supports vector embeddings for the RAG-powered coaching chat.
  - **Real-time Subscriptions** let parts of the UI update instantly when data changes (such as analysis status).
- **Supabase Admin Client**
  - A secure, server-side client for writing AI analysis output into the database, bypassing user-level restrictions when needed.
- **Python-based Analysis Service (FastAPI or NestJS)**
  - Processes uploaded videos with libraries like MoviePy and OpenCV.
  - Runs machine learning models (TensorFlow or PyTorch) to extract manoeuvre timings and performance metrics.
  - Exposes its own API that Next.js routes call to start or check analysis jobs.
- **Stripe**
  - Manages customer billing, subscription tiers, trials, and webhook events to keep user access in sync with payments.

## Infrastructure and Deployment

- **Version Control: Git & GitHub**
  - Tracks code changes, supports pull requests, and allows easy collaboration.
- **Hosting & Deployment: Vercel (or similar)**
  - Automatically builds and deploys Next.js projects on each push to the main branch.
- **CI/CD Pipeline: GitHub Actions**
  - Runs automated checks (lint, tests) on every commit and deploys successful builds.
- **Environment Variable Management**
  - Sensitive keys (Supabase, Clerk, Stripe, OpenWeatherMap) live in `.env` files or platform secrets.
- **Background Job Queue**
  - Handles long-running tasks (video analysis) outside of HTTP request timeouts. Options include Vercel Cron Jobs, Inngest, or BullMQ.

## Third-Party Integrations

- **Clerk**: Authentication provider with built-in role support.
- **Supabase**: All-in-one backend (database, storage, real-time, vector search).
- **Stripe**: Payments, subscriptions, and billing webhooks.
- **LangChain**: Facilitates the RAG (Retrieval-Augmented Generation) chat by querying vector embeddings in Supabase.
- **OpenWeatherMap API** (optional): Can enrich session data with local weather conditions.
- **Charting Libraries**: Recharts, Visx, or Nivo for interactive data visualizations.

## Security and Performance Considerations

- **Authentication & Authorization**
  - Clerk issues secure tokens and stores user roles in metadata.
  - Next.js middleware or API route checks ensure only the right users access each page or endpoint.
- **Data Protection**
  - Supabase Row Level Security (RLS) restricts who can read or write specific rows in the database.
  - Signed, time-limited upload URLs prevent unauthorized file uploads.
- **Webhook Verification**
  - Stripe webhook signatures are verified to guard against spoofed events.
- **Performance Optimizations**
  - Server Components in Next.js reduce client-side JavaScript.
  - React Query’s caching avoids redundant network requests.
  - Lazy-loading or virtualizing long tables and charts keeps the UI responsive.
  - Background job queue offloads heavy video processing from the main server thread.

## Conclusion and Overall Tech Stack Summary

This starter template brings together a modern, cohesive set of technologies:

- A **React/Next.js** frontend powered by **TypeScript**, **Tailwind CSS**, and **React Query** for a fast, type-safe UI experience.
- A **serverless API layer** and **Python-based analysis engine** for orchestrating video processing and AI models.
- **Supabase** as a unified backend for database, file storage, real-time updates, and vector search.
- **Clerk** for secure multi-role authentication and **Stripe** for subscription billing.
- Infrastructure choices (Vercel, GitHub Actions) that ensure smooth deployments and scalable operation.

Together, these choices give developers a solid, production-ready foundation for SailIQ’s core features—video uploads, AI-driven insights, interactive dashboards, and chat-based coaching—so they can focus on what really matters: delivering an outstanding sailing analytics experience.