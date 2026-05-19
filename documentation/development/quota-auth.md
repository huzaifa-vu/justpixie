# 🔒 Authentication & Quota System

Pixie maintains a dual-tier authorization system designed to prevent api exhaustion while maintaining user access. This document details how daily quota tracking, guest security guards, and database rules are structured.

---

## 🚦 Quota Tier Matrix

Pixie defines three user authorization tiers:

| Tier Level | Daily Prompt Limit | Verification Mechanism | Storage Method |
|---|---|---|---|
| **Guest (Unauthenticated)** | 3 Prompts | IP Address lookup | `guest_usage` Postgres Table |
| **Explorer (Authenticated - Free)**| 100 Prompts | Supabase Auth User ID | Auth metadata (`prompts_used`) |
| **Unlimited (Authenticated - Paid)**| Unlimited | Subscription receipt | Auth metadata (`tier: "unlimited"`) |

*Note: Quota constraints apply ONLY to the optional AI Semantic Routing bar. The offline tools (e.g. compressing an image or merging PDFs manually) can be run infinitely without quotas.*

---

## ⚡ API Quota Check Pipeline (`/api/ai/router`)

The server-side route handler verifies daily usage thresholds before sending prompts to the Gemini API:

```
[Request Inbound]
       │
       ▼
[Is User Logged In?]
       │
       ├──► Yes: Load fresh Auth Metadata via Admin Client
       │           │
       │           ├─► If last_prompt_date !== today, reset prompts_used to 0
       │           │
       │           ├─► If prompts_used >= 100 & tier !== "unlimited" ──► Block [402 Quota Reached]
       │           │
       │           └─► Else: Pre-increment count & proceed
       │
       └──► No:  Detect client IP Address
                   │
                   ├─► Query guest_usage table for IP
                   │
                   ├─► If last_date !== today, reset count to 0
                   │
                   ├─► If count >= 3 ──────────────────────────────────► Block [402 Quota Reached]
                   │
                   └─► Else: Pre-increment guest count & proceed
```

---

## 💾 Database Schemas

Guest and transaction logs are maintained in a PostgreSQL database managed by Supabase.

### 1. Guest Tracking Table (`guest_usage`)
Maintains IP usage logs. IPs are hashed or scrubbed regularly depending on regional compliance rules:
```sql
CREATE TABLE guest_usage (
  ip VARCHAR(45) PRIMARY KEY,      -- Supports both IPv4 and IPv6 string lengths
  count INT DEFAULT 0,             -- Number of prompts used today
  last_date DATE DEFAULT CURRENT_DATE -- Tracking date
);
```

### 2. Authenticated User Metadata Schema
Instead of maintaining a separate user profile table for quotas, Pixie uses Supabase Auth's secure `user_metadata` JSON column. This reduces database queries:
*   `tier`: Set to `"free"` or `"unlimited"`.
*   `prompts_used`: Integer count.
*   `last_prompt_date`: ISO Date string format `YYYY-MM-DD`.

---

## 🔄 Daily Reset Mechanics

Quotas reset dynamically without cron jobs:
1.  **Logic:** The system gets the server's current date string in `YYYY-MM-DD` format (using `new Date().toISOString().split('T')[0]`).
2.  **Comparison:** It compares the current date string with the user's `last_prompt_date` (or `last_date` for guests).
3.  **Reset:** If they do not match, the transaction logic treats the current usage as `0` and updates the date tag to today, resetting the daily limit.

---

## 📡 The Client Quota Hook (`useQuota.ts`)

The interface reacts to quota changes dynamically via the `useQuota` hook.
*   **Dynamic Listener:** The sidebar and billing widgets listen to a window event (`pixie_quota_changed`).
*   **Optimistic updates:** When a user submits an AI prompt, the client triggers `syncLimitReached()` to optimistically deplete the quota local state before the database re-fetch completes, preventing double-click bypass attempts.
