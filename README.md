# Morapay Web

This Turborepo duplicates the existing `../frontend` Next.js app into three deployable web apps while keeping the original frontend untouched as the migration source of truth.

## Apps

- `apps/landing` (`@morapay/landing`) for `morapay.com` marketing and public pages.
- `apps/app` (`@morapay/app`) for `app.morapay.com` pay, receive, and client app flows.
- `apps/checkout` (`@morapay/checkout`) for `checkout.morapay.com` checkout routes.

Each app currently contains the full frontend copy. Route ownership is gated in each app's `next.config.ts` redirects so deploys can be split without deleting routes yet.

## Development

Install dependencies once from this folder:

```bash
pnpm install
```

Run each app independently:

```bash
pnpm dev --filter=@morapay/landing
pnpm dev --filter=@morapay/app
pnpm dev --filter=@morapay/checkout
```

Default dev ports are 3000 for landing, 3001 for app, and 3002 for checkout.

Build or lint through Turbo:

```bash
pnpm build
pnpm lint
```
