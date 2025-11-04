# Frontend Guideline Document for SailIQ

This document outlines the frontend architecture, design principles, and technologies used in the SailIQ codebase (`sailiq-codeguide-starter`). It provides a clear reference for developers, designers, and stakeholders, ensuring everyone understands how the frontend is set up, why certain choices were made, and how to work within this system.

---

## 1. Frontend Architecture

### 1.1 Overview
- **Framework**: Next.js 14 with the App Router. We use server components for initial data-heavy page renders and client components for interactive UI parts.
- **Language**: TypeScript everywhere—pages, components, API routes—so our code is type-safe and self-documenting.
- **Styling**: Tailwind CSS for utility-first styles, enhanced by shadcn/ui component library for consistent design tokens.
- **Data Layer**:
  - **Supabase**: Acts as our primary database (PostgreSQL), file storage (video uploads), and real-time update source. We also leverage Supabase Vector (pgvector) for RAG chat embeddings.
  - **Clerk**: Manages user authentication, roles (Sailors, Coaches, Club Admins), and session metadata.
  - **Stripe**: Handles payments and subscriptions via serverless webhook routes.
  - **TanStack React Query**: Powers data fetching, caching, and background polling for long-running tasks (e.g., video analysis).

### 1.2 Scalability, Maintainability & Performance
- **Server Components** reduce client bundle size by rendering static content on the server.
- **API Routes**: Next.js serverless routes glue together the frontend, Supabase, Stripe, and external AI services. They keep client code simple.
- **Modular Folder Layout**: Separates concerns into `app/` (routes and pages), `components/` (UI building blocks), `utils/` or `services/` (API clients), and `types/` (shared TypeScript definitions).
- **Edge Functions / Serverless**: Key endpoints (file upload URL generation, webhook handling) are deployed in a scalable serverless environment.

---

## 2. Design Principles

1. **Usability**: Intuitive workflows for sailors to upload videos, view analytics, and chat with the AI coach. Clear calls to action and consistent navigation bars.
2. **Accessibility**: Semantic HTML, keyboard navigable components, and ARIA attributes. Tailwind’s focus utilities ensure visible focus states.
3. **Responsiveness**: Mobile-first design with fluid layouts using Tailwind’s responsive utilities (`sm:`, `md:`, `lg:` breakpoints).
4. **Consistency**: Uniform spacing, typographic scale, and button styles via shared design tokens in shadcn/ui.
5. **Feedback**: Loading spinners, skeleton screens, and toast messages for asynchronous operations (uploads, payments, data fetches).

**How we apply them**:
- Forms use clear labels and input hints.
- Charts and tables resize or switch layouts on small screens.
- Color contrast meets WCAG AA standards.
- Interactive elements follow predictable patterns (click, hover, disabled states).

---

## 3. Styling and Theming

### 3.1 Styling Approach
- Tailwind CSS for utility classes—no custom CSS files unless necessary.
- BEM-like conventions for custom component classes when needed, but most styling is in JSX.
- No SASS; the simplicity of Tailwind avoids nested style files.

### 3.2 Theming
- **Design Tokens**: Colors, font sizes, and spacing are defined in `tailwind.config.js` and exposed via shadcn/ui.
- **Dark Mode**: Configured using Tailwind’s `dark:` variants and a toggle component stored in React Context.

### 3.3 Visual Style
- Style: **Modern Flat Design** with subtle glassmorphism accents on modal backdrops.
- **Color Palette**:
  - Primary: #1D3557 (Deep Navy)
  - Secondary: #457B9D (Sky Blue)
  - Accent: #E63946 (Coral Red)
  - Success: #2A9D8F (Teal)
  - Neutral Background: #F1FAEE (Off White)
  - Surface: #FFFFFF (White)
  - Dark Surface: #2C3E50 (Almost Black)

### 3.4 Typography
- **Font Family**: Inter (sans-serif) for body text; Poppins for headings.
- **Scale**:
  - h1: 2.25rem (36px)
  - h2: 1.875rem (30px)
  - h3: 1.5rem (24px)
  - Body: 1rem (16px)
  - Caption: 0.875rem (14px)

---

## 4. Component Structure

- **Atomic Design**: We build small, reusable components (`Button`, `Input`, `Modal`, `ChartWrapper`) and compose them into larger feature-level components (e.g., `SessionList`, `UploadForm`, `DashboardLayout`).
- **File Organization**:
  - `components/ui/` contains shared, styled UI primitives from shadcn/ui.
  - `components/charts/` houses chart-specific wrappers (e.g., Recharts or Visx integrations).
  - `app/` routes import these components to build pages.
- **Reusability**: Every component has a clear API (props) and minimal internal logic. Side effects and data fetching stay outside in hooks or page-level code.

**Benefits**:
- Easier to test and document small pieces.
- Consistent look and feel across the app.
- Faster onboarding for new developers—component usage is predictable.

---

## 5. State Management

### 5.1 Server State
- **TanStack React Query**: Fetches data from Supabase and API routes. Automatically caches, refetches, and handles retries.
- **Polling**: For video analysis status, we poll an endpoint until the job completes, then render results.

### 5.2 Client State
- **React Context**: Manages theme (light/dark) and authentication state (Clerk session).
- **Local Component State**: `useState` / `useReducer` for transient UI state (form inputs, modal open/close).

**Why this mix**:
- React Query keeps our data layer predictable and de-duplicated.
- Context and local state are lightweight and clear for purely UI concerns.

---

## 6. Routing and Navigation

- **Next.js App Router** handles page routing via the `app/` directory. Each folder under `app/` maps to a route.
- **Nested Layouts**: Shared layouts (e.g., `DashboardLayout`) wrap children pages, providing consistent nav bars and side panels.
- **Dynamic Routes**: E.g., `app/session/[id]/page.tsx` for per-session detail pages.
- **Linking**: We use Next.js `<Link>` for client-side navigation, with `prefetch` enabled on visible links.

**Navigation Flow**:
1. **Login**: Redirect to `/dashboard` on success.
2. **Upload**: Visit `/upload` to add new sailing sessions.
3. **Dashboard**: `/dashboard` lists past sessions and analytics summaries.
4. **Session Detail**: `/session/[id]` to view charts, tables, and RAG chat.

---

## 7. Performance Optimization

- **Code Splitting**: Next.js automatically splits by route. We further use `dynamic()` imports for heavy chart libraries.
- **Image & Video Handling**: Use Next.js `<Image>` for thumbnails; upload videos directly to Supabase Storage with signed URLs to offload traffic.
- **Server Components**: Render static parts on the server to reduce client bundle size.
- **Lazy Loading**: Charts and RAG chat load on first view, not on initial page load.
- **Caching**: React Query caches API responses and invalidates on mutations (e.g., new video upload triggers refetch of session lists).
- **Asset Optimization**: Tailwind CSS is purged in production; static assets are served via CDN.

---

## 8. Testing and Quality Assurance

### 8.1 Unit & Integration Tests
- **Jest** + **React Testing Library** for components. Focus on:
  - Input validation in forms.
  - Button clicks and modal open/close behaviors.
  - Conditional rendering based on props.

### 8.2 API & Data Layer Tests
- **msw (Mock Service Worker)** for mocking Supabase and Stripe in tests.
- Test React Query hooks in isolation with mocked fetch calls.

### 8.3 End-to-End Tests
- **Playwright** (or Cypress) to cover critical workflows:
  1. Sign up / Log in.
  2. Video upload process (obtain signed URL, upload file, trigger analysis).
  3. Dashboard rendering after analysis completes.
  4. Stripe subscription flow (test webhook handling).

### 8.4 Linting & Formatting
- **ESLint** with Next.js and TypeScript rules.
- **Prettier** for consistent code style.
- **Tailwind CSS lint plugin** to catch unused classes.

---

## 9. Conclusion and Frontend Summary

The SailIQ frontend is built on a modern, scalable foundation: Next.js 14 with TypeScript, Clerk for authentication, Supabase for data, Stripe for payments, and Tailwind CSS + shadcn/ui for design consistency. We follow clear design principles—usability, accessibility, responsiveness—and embrace a component-based architecture to keep code maintainable and reusable.

Performance is optimized through server components, code splitting, and smart data caching with React Query. A robust testing strategy ensures reliability from individual components to full user flows.

Together, these guidelines create a frontend ecosystem that lets the team focus on the unique video analysis and AI coaching features of SailIQ, rather than reinventing standard SaaS building blocks. This document should serve as your go-to reference for any frontend work, ensuring clarity, consistency, and quality across the project.