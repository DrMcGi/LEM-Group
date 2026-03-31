## LEM Accommodation Rental App

Modern rental website for LEM Accommodation with:
- property showcase for both locations
- inquiry submission API with server-side validation
- lightweight internal inquiries dashboard

### Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Zod validation
- Local JSON persistence for inquiries

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

- `/` public property and inquiry page
- `/admin/inquiries` simple internal leads table
- `/api/properties` property JSON API
- `/api/inquiries` inquiries API (`GET`, `POST`)

### Inquiry Storage

Inquiries are stored in `storage/inquiries.json`.

### Production Upgrade Path

For production scale, replace `src/lib/inquiry-store.ts` with a database-backed repository (for example Prisma + PostgreSQL) while keeping the same API contract.
