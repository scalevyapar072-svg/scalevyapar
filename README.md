# ScaleVyapar - Business Automation Platform

A complete business automation platform built with Next.js, featuring admin and client dashboards with module-based access control.

## Features

### Admin Panel (`/admin`)
- Dashboard with client statistics
- Client management (add, view, edit clients)
- Module assignment per client
- Enable/disable individual modules

### Client Dashboard (`/dashboard`)
- Personalized sidebar showing assigned modules
- Home page with quick stats
- Module pages: Leads, CRM, WhatsApp, Shopify, Inventory
- Role-based access control

### Authentication
- NextAuth.js with credentials provider
- Role-based routing (Admin → /admin, Client → /dashboard)
- Protected routes with middleware

### Database
- Prisma ORM with SQLite
- User management with roles
- Module and user-module relationships

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Authentication**: NextAuth.js 5
- **Database**: Prisma + SQLite
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed the database with default admin user
npm run db:seed
```

### 3. Configure Environment

Update `.env.local` with your NextAuth configuration:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Default Credentials

**Admin User:**
- Email: `admin@scalevyapar.com`
- Password: `admin123`

## Database Schema

### User
- id: String (CUID)
- name: String
- email: String (unique)
- password: String (hashed)
- role: ADMIN | CLIENT
- createdAt: DateTime

### Module
- id: String (CUID)
- name: String
- slug: String (unique)

### UserModule
- userId: String
- moduleId: String
- isEnabled: Boolean (default: true)

## API Routes

### Admin Routes
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new client
- `GET /api/admin/modules` - Get all modules

### Client Routes
- `GET /api/dashboard/modules` - Get user's enabled modules

## Project Structure

```
app/
├── admin/           # Admin panel pages
├── api/             # API routes
├── dashboard/       # Client dashboard
│   ├── [slug]/      # Dynamic module pages
├── login/           # Login page
├── globals.css      # Global styles
├── layout.tsx       # Root layout
└── page.tsx         # Home page (redirects based on role)

components/
├── providers.tsx    # Session provider

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Database seeding

auth.ts              # NextAuth configuration
middleware.ts        # Route protection
```

## Available Modules

1. **Lead Generation** (`/dashboard/leads`) - Capture and manage leads
2. **CRM** (`/dashboard/crm`) - Customer relationship management
3. **WhatsApp** (`/dashboard/whatsapp`) - WhatsApp business automation
4. **Shopify** (`/dashboard/shopify`) - E-commerce integration
5. **Inventory** (`/dashboard/inventory`) - Stock management

## Development

### Adding New Modules

1. Add module to database via seed file
2. Create module page in `app/dashboard/[slug]/page.tsx`
3. Update module info in the page component

### Customizing Styling

The application uses Tailwind CSS with a professional design:
- Dark sidebar for navigation
- Clean white content areas
- Blue accent colors for branding

## Deployment

### Environment Variables for Production

```env
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=your-database-url
```

### Build Commands

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License.
