# Preventyx

**AI-powered cancer prevention platform for Canadians.**

Preventyx generates personalized cancer screening and prevention care plans grounded in Cancer Care Ontario (CCO) clinical pathways. Users log in, select a cancer type, answer AI-generated intake questions, and receive a structured care calendar with step-by-step guidance, prerequisite ordering, and a health tracker to log completed tests.

---

## What It Does

1. **Landing page chatbot** — After logging in via Replit Auth, users select one of 14 cancer types sourced directly from Pinecone. The bot asks 3–5 AI-generated intake questions (e.g. family history, age, lifestyle factors) to assess risk level.

2. **Care plan generation** — The backend queries a Pinecone vector database of Cancer Care Ontario documents, retrieves the most relevant clinical guidelines, and sends them to GPT-5.2 to generate a structured, personalized care plan with:
   - Correct CCO screening intervals (e.g. mammogram every 2 years, HPV test every 5 years)
   - Step ordering with prerequisite locking (e.g. GP referral must come before specialist)
   - Required actions and urgency levels

3. **Dashboard** — A monthly calendar view of all care plan events with color-coded dots by type, an upcoming events sidebar, and a risk profile summary.

4. **Health Tracker** — A step-by-step checklist of care plan events ordered by step number. Locked steps show a warning until their prerequisite is marked complete. Users can mark steps done, provide emoji feedback, and add manual health log entries.

5. **AI Advisor** — A persistent chat interface powered by GPT-5.2 for follow-up questions about screening, symptoms, or lifestyle.

---

## Cancer Types Supported

All cancer types are sourced from Pinecone — only types with clinical pathway data are shown:

Breast · Colorectal · Cervical · Lung · Prostate · Esophageal · Endometrial · Thyroid · Bladder · Oropharyngeal · Ovarian · Liver (HCC) · Thymic · Cervical Lymphadenopathy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Wouter |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Replit built-in) with Drizzle ORM |
| AI | OpenAI GPT-5.2 via Replit AI Integrations proxy |
| Vector search | Pinecone (`cancer-care-ontario-pathways`, model: `llama-text-embed-v2`) |
| Auth | Replit Auth (OpenID Connect / PKCE) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
/
├── artifacts/
│   ├── cancer-guard/          # React frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx           # Landing page chatbot + onboarding
│   │       │   ├── Dashboard.tsx      # Care plan calendar view
│   │       │   ├── HealthTracker.tsx  # Step-by-step test tracker
│   │       │   └── AIChat.tsx         # AI advisor chat
│   │       └── components/
│   │           └── layout/AppLayout.tsx
│   └── api-server/            # Express REST API
│       └── src/routes/
│           ├── agent.ts           # Pinecone RAG + GPT care plan generation
│           ├── care-plans.ts      # Care plan CRUD
│           ├── health-logs.ts     # Health log entries
│           ├── profiles.ts        # User profile registration
│           └── auth.ts            # Replit Auth session
└── lib/
    ├── db/                    # Drizzle ORM schema + migrations
    │   └── src/schema/
    │       ├── care-plans.ts      # care_plans, care_plan_events, care_plan_actions
    │       ├── health-logs.ts     # health_logs
    │       └── profiles.ts        # user profiles
    ├── api-spec/              # OpenAPI spec
    ├── api-zod/               # Zod validators
    └── replit-auth-web/       # Replit Auth React hook
```

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Replit account (for Auth and managed PostgreSQL)
- A Pinecone account with an index populated from Cancer Care Ontario documents

### Environment Variables

Set the following secrets in your Replit environment:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |
| `PINECONE_API_KEY` | Your Pinecone API key |
| `PINECONE_HOST` | Your Pinecone index host URL |
| `PINECONE_NAMESPACE` | Namespace in the index (default: `CancerPathways`) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI-compatible base URL (set by Replit AI Integrations) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | API key for Replit AI Integrations proxy |
| `SESSION_SECRET` | Random string for signing Express sessions |
| `REPL_ID` | Auto-set by Replit — used for Replit Auth |

### Install Dependencies

```bash
pnpm install
```

### Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

### Run in Development

Start both servers (or use the Replit workflow buttons):

```bash
# API server (port from $PORT env, default 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (proxied through Replit at /)
pnpm --filter @workspace/cancer-guard run dev
```

---

## How the Care Plan is Generated

1. The user selects a cancer type on the landing page chatbot.
2. The API calls `POST /api/agent/questions` — Pinecone is searched for relevant CCO documents, and GPT-5.2 generates 3–5 Yes/No risk assessment questions specific to that cancer type.
3. The user answers each question in the chatbot.
4. The API calls `POST /api/agent/intake` — Pinecone is searched again with the full risk context, and GPT-5.2 generates a structured JSON care plan with:
   - `user_profile` — risk category, eligibility status, recommended pathway
   - `care_plan_events[]` — ordered steps with dates, frequencies, prerequisite links, and clinical references
   - `required_actions[]` — immediate action items with urgency levels
5. The care plan is saved to PostgreSQL and the ID is stored in `localStorage`.

### CCO Screening Intervals Enforced

The AI prompt strictly enforces real CCO intervals:

- **Breast Cancer** — Mammogram every 2 years (average risk, ages 40–74)
- **Cervical Cancer** — HPV test every 5 years (updated March 2025, ages 25–70)
- **Colorectal Cancer** — FIT kit every 2 years; colonoscopy every 5–10 years (high risk)
- **Lung Cancer** — Annual low-dose CT scan; eligibility assessment must precede any scan
- **All others** — GP referral as Step 1, then specialist pathway (no organized Ontario program exists)

---

## Key Design Decisions

- **Pinecone-only cancer types** — Only cancers with actual vector data are shown on the landing page. No cancer types are hardcoded outside of what Pinecone can support.
- **Prerequisite locking** — Each care plan event can declare a `prerequisite_event_id`. The Health Tracker locks later steps until prior steps are marked complete.
- **Replit Auth as the sole identity layer** — No custom username/password is collected. The user's name and identity come entirely from their Replit account.
- **Session-based care plan linking** — `preventyx_care_plan_id` is stored in `localStorage` and used by both the Dashboard and Health Tracker to load the active plan.

---

## Disclaimer

Preventyx is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider regarding any medical conditions or screening decisions.
