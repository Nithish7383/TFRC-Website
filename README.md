# First Rule Club — Running Event Registration System

Full-stack web app built with Next.js 14, Tailwind CSS, and Supabase.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (dark theme, gold accent)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd first-rule-club
npm install
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. Go to **Authentication → Users** → create admin accounts manually (one per admin)
4. Copy your **Project URL** and **anon public key** from Settings → API

### 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` (Settings → API → service_role) is server-only — never expose it with a `NEXT_PUBLIC_` prefix. It's used to create a member's Supabase Auth account the first time they set a password (see `app/login/actions.ts`).

### 4. Run Locally

```bash
npm run dev
```

---

## Folder Structure

```
/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── register/page.tsx           # Public registration form
│   ├── confirmation/page.tsx       # Success page
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── login/page.tsx          # Admin login
│   │   └── event/[id]/page.tsx     # Event detail + registrations
│   └── api/events/toggle/route.ts  # Toggle event active/inactive
├── components/
│   ├── RegisterForm.tsx            # Registration form (client)
│   ├── CreateEventForm.tsx         # Create event form (admin)
│   ├── RegistrationTable.tsx       # Admin table with select/reject
│   ├── CopyWhatsAppButton.tsx      # WhatsApp message copy tool
│   └── AdminSignOutButton.tsx      # Sign out
├── lib/
│   ├── supabase.ts                 # Browser Supabase client
│   ├── supabase-server.ts          # Server Supabase client
│   └── types.ts                   # TypeScript types
├── middleware.ts                   # Protects /admin/* routes
└── supabase-schema.sql             # Full DB schema + RLS policies
```

---

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with active events |
| `/register` | Public | Registration form |
| `/confirmation` | Public | Success page after registration |
| `/admin/login` | Public | Admin login |
| `/admin` | Admin only | Dashboard: events + create |
| `/admin/event/[id]` | Admin only | Registrations + select/reject |

---

## Adding Admins

1. Go to Supabase Dashboard → **Authentication → Users**
2. Click **Add user** → enter email + password
3. That user can now log in at `/admin/login`

All admins have equal full access.

---

## WhatsApp Flow

1. Go to `/admin/event/[id]`
2. Select participants using **Select** buttons
3. Scroll to the green "selected participants" section
4. Click **Copy WhatsApp Message** → paste and send manually
5. Or click **Open in WhatsApp** next to each runner for a direct link

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — do not prefix with `NEXT_PUBLIC_`)

---

## Logo

Replace the placeholder emoji in `app/page.tsx` with your actual logo:

```tsx
<Image src="/logo.png" alt="First Rule Club" width={80} height={80} />
```

Place your logo file in the `/public` folder.
