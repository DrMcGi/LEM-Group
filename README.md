## LEM Accommodation Rental App

Modern rental website for LEM Accommodation with:
- property showcase for both locations
- enquiry submission API with server-side validation
- lightweight internal enquiries dashboard

### Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zod validation
- Local JSON persistence for enquiries

### Properties Included

1. Lebowakgomo Unit F, House no 1680, RDP Section
	- 10x monthly rental rooms
	- R2,400 per room / month
	- Prepaid electricity
	- Free Wi-Fi
2. Woodlands Estate, The Glen, unit no 04, Bendor, Polokwane
	- 3 bedroom, 3 bathroom
	- Single garage
	- R20,000 / month

### Getting Started

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Useful Routes

- `/` public property and enquiry page
- `/admin/enquiries` internal leads table (preferred)
- `/admin/inquiries` internal leads table (legacy; still supported)
- `/api/properties` property JSON API
- `/api/inquiries` enquiries API (`GET`, `POST`)

### Enquiry Storage

Enquiries are stored in `storage/inquiries.json`.

## Admin Portal

The admin portal is available under:

- `/admin` (dashboard)
- `/admin/inquiries` (manage enquiry statuses)
- `/admin/properties` (edit pricing and room availability)
- `/admin/users` (create additional admin users)

### Initial admin setup

Set the following environment variables before running the app:

- `AUTH_SECRET` (required in production; minimum 16 characters)
- `ADMIN_EMAIL` (used to auto-create the first admin user if no admin users exist yet)
- `ADMIN_PASSWORD` (used to auto-create the first admin user if no admin users exist yet)
- `ADMIN_NAME` (optional)

### Admin image uploads (Vercel Blob)

Room image uploads in the admin portal use Vercel Blob.

- Set `BLOB_READ_WRITE_TOKEN` in your environment (locally and in Vercel project env vars).

After the first admin is created, additional admins can be created via `/admin/users`.

### Enquiry workflow

Public enquiries are submitted to the site (stored for the admin dashboard) and WhatsApp is opened with a pre-filled message for the user to send.

### Production Upgrade Path

For production scale, replace `src/lib/inquiry-store.ts` with a database-backed repository (for example Prisma + PostgreSQL) while keeping the same API contract.
