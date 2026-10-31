# ShadowHunt Multiplayer — starter project

A mobile-first GPS manhunt game starter built with Next.js 15 and Supabase.

## What is included
- Email/password account sign-up and sign-in
- Create and join six-character private rooms
- Hunter and Shadow roles, host-controlled match start
- 3-minute Shadow head start and 30-minute match clock
- Browser GPS sharing, server-side proximity validation (30 m)
- Room roster refresh and server-side room/player reads
- SQL schema with row-level security enabled
- Exact GPS coordinates are **not returned by the roster API**; browser clients cannot directly query the tables

## Important: starter, not yet a public production launch
This project has not been load-tested or deployed. It does not yet include a real interactive map, automated 3-minute ping scheduler, server-managed shrinking safe-zone enforcement, push notifications, anti-GPS-spoofing, moderation/reporting, or comprehensive abuse/rate limiting. Do not use it for public events until those features and a safety review are completed. Location-based play should stay in public, safe areas; never trespass or run into traffic.

## Deploy using Vercel (free subdomain) + Supabase
You need your own accounts at Supabase and Vercel. The project cannot be published under your account without you signing in and creating those resources.

1. Create a Supabase project at https://supabase.com.
2. In Supabase, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
3. In Supabase **Project Settings → API**, copy the Project URL, anon/public key, and service_role key.
4. Upload this project to a private GitHub repository, then import that repository at https://vercel.com/new.
5. In Vercel → Project → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never add a `NEXT_PUBLIC_` prefix)
6. Deploy. Vercel will provide a free `your-project.vercel.app` address.
7. In Supabase → Authentication → URL Configuration, set **Site URL** to the Vercel address and add that address to **Redirect URLs**.

Never send your service-role key in chat, email, or source code. Enter it directly in Vercel's environment-variable screen.

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment variables
See `.env.example`.

## Before inviting lots of players
- Add rate limits and abuse protection to every API route.
- Add server-managed ping cadence and shrinking-zone checks.
- Build role-specific location disclosure (coarse/delayed hints only; never expose exact Shadow GPS to Hunters).
- Add map rendering, consent/retention controls, emergency exit, reporting/blocking and moderator tools.
- Load-test the expected room sizes and configure Supabase database/Realtime quotas accordingly.
- Review privacy, local laws and physical safety. Browser GPS is not proof of a person's true location.
