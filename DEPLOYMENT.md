# BCSO — Netlify Deployment Guide

**Bahamas Compliance & Safety Oversight Ltd. (BCSO)**
Full-stack Next.js 16 app with PostgreSQL (Neon), deployed on Netlify.

---

## Architecture on Netlify

| Concern | How it runs |
|---|---|
| Next.js pages (SSR, Middleware) | Netlify Functions via `@netlify/plugin-nextjs` (OpenNext) |
| API routes (`/api/*`) | Netlify Serverless Functions |
| Auth Middleware | Netlify Edge Functions (fast, no cold-start) |
| Database | Neon serverless PostgreSQL (`@neondatabase/serverless`) |
| File storage | Not required — evidence photos stored as base-64 in Neon |

---

## Step 1 — Create a Neon database (free tier available)

Netlify needs a cloud PostgreSQL database it can reach from serverless functions.
**Neon** is the recommended choice — free tier, serverless-native, works with the existing Drizzle ORM setup.

1. Go to **https://neon.tech** and sign up (free).
2. Click **New project** → choose a name and region (pick US East for lowest latency from the Bahamas).
3. On the project dashboard, click **Connection details**.
4. Copy the **Pooled connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Keep this URL — you'll paste it into Netlify as `NEON_DATABASE_URL`.

> **Free tier limits:** 0.5 GB storage, 100 compute hours/month. Sufficient for BCSO in early operation. Upgrade when needed.

---

## Step 2 — Push code to GitHub

Netlify deploys from a Git repository.

```bash
# One-time setup
git init
git add .
git commit -m "Initial BCSO dashboard"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_ORG/bcso-dashboard.git
git push -u origin main
```

**Important — make sure `.gitignore` excludes secrets:**

```
.env
.env.local
.env.production
node_modules
.next
```

The `.env` file in this project contains your local dev database URL.
**Never commit it.** All production secrets go into the Netlify dashboard.

---

## Step 3 — Connect to Netlify

1. Go to **https://app.netlify.com** → **Add new site** → **Import an existing project**.
2. Choose **GitHub** and authorize Netlify.
3. Select your `bcso-dashboard` repository.
4. Netlify will auto-detect Next.js. Verify the settings:

   | Setting | Value |
   |---|---|
   | Base directory | *(leave empty)* |
   | Build command | `npm run build` |
   | Publish directory | `.next` |
   | Node version | `20` *(set in netlify.toml)* |

5. Click **Deploy site** — the first deploy will fail because the environment variables aren't set yet. That's expected.

---

## Step 4 — Set environment variables in Netlify

In your Netlify site dashboard go to **Site configuration → Environment variables** and add:

### Required

| Key | Value | Notes |
|---|---|---|
| `NEON_DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Pooled connection string from Neon dashboard |
| `NODE_ENV` | `production` | Enables secure cookies and production behaviour |

### Optional — SMTP email dispatch (for sending reports)

| Key | Example value | Notes |
|---|---|---|
| `SMTP_HOST` | `smtp.sendgrid.net` | Your email provider's SMTP host |
| `SMTP_PORT` | `587` | Usually 587 (TLS) or 465 (SSL) |
| `SMTP_USER` | `apikey` | SendGrid uses the string "apikey" |
| `SMTP_PASS` | `SG.xxxxxxxxxxxx` | Your SendGrid API key |
| `SMTP_FROM` | `"BCSO <noreply@bcso.bs>"` | The From address shown to clients |

> **If SMTP is not configured**, the dashboard still works — reports are logged as "simulated" in the delivery log. You can configure SMTP later without redeployment.

---

## Step 5 — Apply the database schema

After the first successful Netlify deploy you need to create the tables in your Neon database.

**Option A — From your local machine (recommended):**

```bash
# Set the Neon URL temporarily in your shell
export NEON_DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Push the Drizzle schema to Neon
npx drizzle-kit push
```

**Option B — Via Netlify CLI:**

```bash
npm install -g netlify-cli
netlify login
netlify link           # links to your Netlify site
netlify env:pull       # pulls env vars to a .env.local file (gitignored)
npx drizzle-kit push   # now reads NEON_DATABASE_URL from .env.local
```

---

## Step 6 — Trigger a redeployment

After setting environment variables go to **Deploys** in your Netlify dashboard and click **Trigger deploy → Deploy site**. This deploy will succeed.

---

## Step 7 — Verify the live site

Visit your Netlify URL (e.g. `https://bcso-dashboard.netlify.app`):

| What to check | Expected |
|---|---|
| `https://your-site.netlify.app/` | Landing page loads |
| `https://your-site.netlify.app/admin` | Redirects to `/admin/access` |
| `https://your-site.netlify.app/assessments` | Redirects to `/admin/access` |
| Sign in with `ADM-2026` | Wait — you need to seed staff first (Step 8) |

---

## Step 8 — Seed the first Admin staff account

The seed API (`/api/admin/seed`) creates the demo staff access codes.
In production you should create staff accounts directly in the database.

**Create your first real admin via Neon's SQL editor:**

```sql
INSERT INTO staff_users (name, email, role, access_code, active)
VALUES
  ('Your Name', 'you@bcso.bs', 'admin', 'ADM-YOURCODE', 'true'),
  ('Reviewer Name', 'reviewer@bcso.bs', 'reviewer', 'REV-YOURCODE', 'true'),
  ('Finalizer Name', 'finalizer@bcso.bs', 'finalizer', 'FIN-YOURCODE', 'true');
```

> Choose your own access codes — they replace the demo codes used in development.
> Keep them secure; share only with the authorized person.

---

## Custom domain (optional)

1. In Netlify → **Domain management** → **Add custom domain**.
2. Enter your domain (e.g. `dashboard.bcso.bs`).
3. Update your DNS registrar to point to Netlify's nameservers or add the CNAME.
4. Netlify auto-provisions a free Let's Encrypt TLS certificate.

---

## Continuous deployment

After setup, every `git push` to `main` automatically:
1. Triggers a Netlify build
2. Runs `npm run build`
3. Deploys the new version (with zero downtime)

Pull request previews are also created automatically — useful for testing changes before they go live.

---

## Netlify vs Vercel

Both work. Vercel has a first-party Neon integration (one-click setup) which is slightly easier. Netlify gives you more control over functions. Either is suitable for BCSO.

---

## Summary checklist

- [ ] Neon project created and pooled connection string copied
- [ ] Code pushed to GitHub
- [ ] Netlify site connected to GitHub repo
- [ ] `NEON_DATABASE_URL` and `NODE_ENV=production` set in Netlify env vars
- [ ] SMTP variables set (optional, for email dispatch)
- [ ] Redeployment triggered and successful
- [ ] `npx drizzle-kit push` run against Neon database
- [ ] Staff accounts created in Neon SQL editor
- [ ] Sign-in tested on live Netlify URL
- [ ] Custom domain configured (optional)
