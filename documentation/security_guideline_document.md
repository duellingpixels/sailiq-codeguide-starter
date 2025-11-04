# SailIQ Codebase Security Guidelines

This security guideline document provides actionable recommendations to secure the `sailiq-codeguide-starter` codebase for the SailIQ sailing video analysis platform. It aligns with industry best practices and the core security principles: Security by Design, Least Privilege, Defense in Depth, Input Validation & Output Encoding, Fail Securely, Keep Security Simple, and Secure Defaults.

---

## 1. Security by Design

- Embed security considerations in every phase: design, development, testing, and deployment.  
- Perform threat modeling for key workflows (video uploads, payment flows, RAG chat).  
- Establish secure defaults in configuration files and environment variables.  
- Integrate security checks into your CI/CD pipeline (linting, SAST, dependency scanning).

## 2. Authentication & Access Control

### 2.1 Clerk Integration
- Enforce strong password policies: minimum length, complexity, rotation if needed.  
- Leverage Clerk’s built-in multi-factor authentication (MFA) for Coaches and Admins.  
- Validate Clerk JWTs on every request: check signature, `exp` claim, and enforce algorithm whitelisting.  
- Store session tokens in Secure, HttpOnly cookies with `SameSite=Lax` or `Strict`.

### 2.2 Role-Based Access Control (RBAC)
- Define roles: Sailor, Coach, Club Admin.  
- Implement server-side middleware in Next.js API routes to authorize by role before performing any sensitive action.  
- Apply the principle of least privilege: only grant the minimum scope of permissions for each API route and Supabase RLS policy.

## 3. Input Handling & Processing

### 3.1 API Inputs
- Validate all incoming data in Next.js API routes using a schema validation library (e.g., Zod).  
- Enforce content-type checks (`application/json`) and reject unexpected payloads.

### 3.2 File Uploads to Supabase Storage
- Generate pre-signed upload URLs via an authenticated API route.  
- Restrict file types (e.g., `.mp4`, `.mov`) and maximum file size before issuing upload URLs.  
- Scan uploaded videos for malware (integrate a virus scanner) in the background job.  
- Store videos outside public buckets or enforce signed URLs for retrieval.

### 3.3 Command and Injection Prevention
- Use parameterized queries or Supabase’s query builder—never concatenate user inputs into SQL strings.  
- Sanitize user-supplied metadata (boat names, session notes) before rendering in UI.

## 4. Data Protection & Privacy

### 4.1 Encryption in Transit & at Rest
- Enforce HTTPS (TLS 1.2+ with strong cipher suites) for all web and API traffic.  
- Verify Supabase connection string uses SSL.  
- Ensure database credentials and Stripe keys are encrypted and never stored in source control.

### 4.2 Secrets Management
- Store all secrets (Clerk API keys, Supabase service role key, Stripe secret key) in a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) or environment variables encrypted at rest.  
- Rotate secrets on a regular schedule and immediately after key leak incidents.

### 4.3 PII Handling
- Mask or truncate PII (user emails, phone numbers) in logs.  
- Provide data deletion endpoints to comply with GDPR/CCPA: purge user data and revoke subscriptions.

## 5. API & Service Security

### 5.1 HTTPS & CORS
- Serve the Next.js application exclusively over HTTPS with HSTS (`Strict-Transport-Security`).  
- Configure CORS to allow only trusted origins (e.g., your production domain) and specific routes for RAG chat or webhooks.

### 5.2 Rate Limiting & Throttling
- Implement rate limits on API endpoints (e.g., upload URL generation, chat queries) to mitigate DoS and brute-force attacks.  
- Use a global throttling mechanism (e.g., API Gateway, Vercel Edge Functions with rate limits).

### 5.3 Webhook Security (Stripe)
- Validate Stripe webhook signatures in `app/api/webhooks/route.ts`.  
- Reject replayed or malformed events by checking the timestamp and signature header.

### 5.4 API Versioning
- Prefix major versions in your API routes (e.g., `/api/v1/upload`, `/api/v2/chat`) to manage breaking changes securely.

## 6. Web Application Security Hygiene

### 6.1 Security Headers
- Set the following HTTP headers globally:  
  - `Content-Security-Policy`: Restrict script/style sources and disallow inline execution.  
  - `X-Frame-Options: DENY` (or `SAMEORIGIN`) to prevent clickjacking.  
  - `X-Content-Type-Options: nosniff` to avoid MIME sniffing.  
  - `Referrer-Policy: strict-origin-when-cross-origin`.

### 6.2 CSRF Protection
- Use Next.js’s built-in CSRF or implement anti-CSRF tokens for all state-changing routes (POST/PUT/DELETE).

### 6.3 Secure Cookies
- Set `Secure`, `HttpOnly`, `SameSite` attributes on all cookies (auth, session).  
- Avoid storing tokens in `localStorage` or `sessionStorage`.

### 6.4 Subresource Integrity (SRI)
- When loading third-party scripts (e.g., analytics), include SRI hashes and serve over HTTPS.

## 7. Infrastructure & Configuration Management

### 7.1 Environment Hardening
- Disable Next.js debug mode and verbose error messages in production.  
- Remove unused serverless functions and API routes.  
- Harden Supabase database by disabling public schema access and configuring Row Level Security (RLS).

### 7.2 Server Configuration
- If self-hosting, lock down ports and disable all non-essential services on the host.  
- Apply OS and package updates regularly using an automated patch management solution.

### 7.3 TLS/SSL Configuration
- Use TLS 1.2+ with strong ciphers (ECDHE, AES-GCM).  
- Disable outdated protocols (SSLv3, TLS 1.0/1.1).

## 8. Dependency Management

- Maintain a lockfile (`package-lock.json`) and audit dependencies on every commit.  
- Integrate a Software Composition Analysis (SCA) tool (e.g., Snyk, Dependabot) to detect vulnerable packages.  
- Review and limit third-party libraries: remove unused imports and dependencies.  
- Keep the Next.js, React, and Tailwind CSS versions up to date with security patches.

## 9. Monitoring, Logging & Incident Response

- Log security-relevant events (login failures, role escalations, file upload errors) to a centralized, immutable logging system.  
- Mask sensitive fields (passwords, tokens) in logs.  
- Create alerting rules for anomalies: repeated failed logins, high error rates on API routes.  
- Develop an incident response plan: define roles, communication channels, and forensics procedures.

---

By following these guidelines, the SailIQ team will ensure the `sailiq-codeguide-starter` foundation is secure, resilient, and maintainable. Periodically review and update this document to keep pace with evolving threats and best practices.