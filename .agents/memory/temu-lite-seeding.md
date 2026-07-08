---
name: Temu Lite seed data reset
description: How to force reseeding of demo data in the Temu Lite e-commerce app
---

The app's `seedData()` routine only inserts demo users/products/orders when the `products` table is empty. If you change the seed logic (new products, orders, statuses, etc.) and want it to take effect, you must truncate the relevant tables first, then restart the workflow.

**Why:** Editing `seedData()` alone has no effect on an already-seeded database — the check silently no-ops, which looks like the changes didn't work.

**How to apply:** Truncate with cascade before restarting, e.g. `TRUNCATE TABLE tracking_logs, shipments, order_items, orders, tasks, products, users RESTART IDENTITY CASCADE;` via psql against `$DATABASE_URL`, then restart the workflow so `seedData()` runs again.
