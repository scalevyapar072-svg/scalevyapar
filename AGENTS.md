<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Frontend Visual Style Rules

For ScaleVyapar dashboard UI:
- Use a premium SaaS style.
- Use compact typography, not oversized/bold fonts.
- Use dark teal/navy sidebar gradients.
- Use soft white workspace background.
- Use rounded cards with subtle borders and soft shadows.
- Use teal buttons and small pill badges.
- Use module-specific soft vector illustrations.
- Keep all UI professional, clean, and close to the provided reference image.
- Do not change business logic, routes, API, auth, database, or module status logic when doing visual work.

## Dashboard Illustration Rules

Each module must have its own art:
- Rozgar: worker hiring, candidate profiles, magnifier, people search.
- WhatsApp: chat bubbles, phone, message automation.
- CRM: customer cards, pipeline, contacts, call notes.
- Inventory: boxes, shelves, stock cards.
- Shopify / Website: storefront, browser, product cards, cart.
- Vitzora: camera, product photo, sparkles, AI image generation.
- Lead Generation: map pins, target, leads list, search network.

All art must:
- Use inline SVG or lightweight CSS/HTML shapes.
- Use teal/blue pastel palette.
- Be decorative only.
- Use `aria-hidden` where needed.
- Avoid external image dependencies.
- Avoid heavy animation or layout shift.

## Animation Rules

- Add subtle reveal animations, card hover lift, and button press feedback.
- Do not add flashing or distracting animations.
- Respect `prefers-reduced-motion`.
- Never break forms, links, routing, or button actions.
- Always run `npm run build`.
- Always deploy preview first.
- Never promote production without approval.

## Safety Rules

Allowed for visual tasks:
- CSS modules
- frontend component markup
- inline SVG illustration components

Not allowed unless explicitly requested:
- `middleware.ts`
- `next.config.ts`
- API routes
- database/schema
- auth/session logic
- payment logic
- Flutter app
- admin/labour
- Rozgar website when task is dashboard-only
