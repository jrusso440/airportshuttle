# Airport Shuttle Dispatch (Next.js) — v2

A web app for an airport shuttle business:
- Schedule rides (create/edit)
- Assign drivers + vehicles
- Driver "My Rides" view with status updates
- Printable day schedule + driver manifests
- **Public booking form** (`/book`) that creates REQUESTED rides
- **Recurring ride patterns** (weekly) that auto-generate day occurrences
- **Warnings** for driver overlap (±30 min) + outside availability
- **Capacity warnings** when party size exceeds vehicle capacity
- **CSV exports**
  - Day export: `/export/day?date=YYYY-MM-DD`
  - Payroll counts: `/export/payroll?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Quick start (local)

```bash
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

Then open: http://localhost:3000

Public booking: http://localhost:3000/book

Seeded logins:
- Admin: `admin@example.com` / `admin123`
- Driver: `alex@example.com` / `driver123`
- Driver: `jamie@example.com` / `driver123`

## Notes
- Auth is a simple signed-cookie session (good for demos). For production, swap to NextAuth/Auth.js or an external provider.
- Email/SMS confirmation is stubbed (logs to console). Plug in Twilio/SendGrid/etc. where indicated.
- Recurring rides are generated idempotently on the Schedule page (and also via a button).


## SQLite + enums note
This version stores roles/status/type/frequency as **strings** for maximum SQLite compatibility.


## Customer booking flow
- Booking form: `/book`
- Submit creates a REQUESTED ride, computes an estimated price, then redirects to:
  - `/book/thanks/[rideId]`

## Resend email
Set these in `.env`:
- `RESEND_API_KEY`
- `BOOKING_FROM_EMAIL` (verified sender)
- `BOOKING_NOTIFY_EMAIL` (optional internal copy)
- `PUBLIC_BASE_URL` (e.g. http://localhost:3000)

If `RESEND_API_KEY` and `BOOKING_FROM_EMAIL` are set, the app sends a confirmation email to the customer (if email provided) and optionally notifies dispatch.
