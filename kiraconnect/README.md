# 🏠 KiraConnect — Smart Rental Platform for Ethiopia

> A full-stack rental marketplace connecting tenants and landlords across Ethiopian cities — no brokers, no fake listings.

---

## 🛠 Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18 + TypeScript + Tailwind CSS    |
| Backend    | Node.js + Express + TypeScript          |
| Database   | MongoDB + Mongoose                      |
| Auth       | JWT (JSON Web Tokens)                   |
| State      | Zustand                                 |
| Realtime   | Socket.io                               |
| Images     | Cloudinary                              |
| HTTP       | Axios                                   |

---

## 📁 Project Structure

```
kiraconnect/
├── backend/
│   └── src/
│       ├── models/         # User, Property, Booking
│       ├── routes/         # auth, properties, bookings, admin
│       ├── middleware/      # auth.ts, errorHandler.ts
│       └── server.ts       # Express + Socket.io entry
└── frontend/
    └── src/
        ├── api/            # authAPI, propertiesAPI, bookingsAPI, adminAPI
        ├── components/     # Navbar, Footer, PropertyCard, AddPropertyModal
        ├── context/        # Zustand stores (auth, property, booking)
        ├── pages/          # Home, Login, Register, Search, Detail, Dashboards
        └── types/          # Shared TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads)

---

### 1. Clone and Install

```bash
# Install all dependencies
npm run install:all

# Or install separately:
cd backend && npm install
cd ../frontend && npm install
```

---

### 2. Configure Environment

```bash
# In /backend, copy the example env file:
cp .env.example .env
```

Edit `/backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kiraconnect
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

---

### 3. Create your first Admin user

After starting the backend, register normally via `/register`, then open MongoDB Compass or shell and update your user's role:

```js
db.users.updateOne({ email: "admin@kiraconnect.et" }, { $set: { role: "admin" } })
```

---

### 4. Run the project

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# → API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# → App running at http://localhost:5173
```

---

## 🔌 API Endpoints

### Auth (`/api/auth`)
| Method | Route              | Auth | Description         |
|--------|--------------------|------|---------------------|
| POST   | /register          | —    | Register user       |
| POST   | /login             | —    | Login & get token   |
| GET    | /me                | ✅   | Get current user    |
| PUT    | /profile           | ✅   | Update profile      |
| PUT    | /change-password   | ✅   | Change password     |

### Properties (`/api/properties`)
| Method | Route                    | Auth       | Description            |
|--------|--------------------------|------------|------------------------|
| GET    | /                        | —          | Search/filter listings |
| GET    | /:id                     | —          | Get property detail    |
| POST   | /                        | Landlord   | Create listing         |
| PUT    | /:id                     | Landlord   | Update listing         |
| DELETE | /:id                     | Landlord   | Delete listing         |
| GET    | /landlord/my-listings    | Landlord   | My properties          |
| POST   | /:id/review              | Tenant     | Add review             |
| POST   | /:id/save                | Tenant     | Save/unsave            |

### Bookings (`/api/bookings`)
| Method | Route             | Auth     | Description           |
|--------|-------------------|----------|-----------------------|
| POST   | /                 | Tenant   | Request viewing       |
| GET    | /                 | ✅       | My bookings           |
| GET    | /:id              | ✅       | Get booking           |
| PUT    | /:id/confirm      | Landlord | Confirm booking       |
| PUT    | /:id/reject       | Landlord | Reject booking        |
| PUT    | /:id/cancel       | Tenant   | Cancel booking        |

### Admin (`/api/admin`)
| Method | Route                        | Auth  | Description           |
|--------|------------------------------|-------|-----------------------|
| GET    | /dashboard                   | Admin | Dashboard stats       |
| GET    | /properties/pending          | Admin | Pending listings      |
| PUT    | /properties/:id/approve      | Admin | Approve listing       |
| PUT    | /properties/:id/reject       | Admin | Reject listing        |
| PUT    | /properties/:id/feature      | Admin | Toggle featured       |
| GET    | /users                       | Admin | All users             |
| PUT    | /users/:id/verify            | Admin | Verify landlord       |
| DELETE | /users/:id                   | Admin | Delete user           |
| GET    | /analytics                   | Admin | Analytics data        |

---

## 🧠 AI Features (Built-in)

The backend auto-calculates a **price estimate** when a listing is created, using city + rooms + furnished flag:

```ts
// In properties.ts route:
const base = basePrices[city] || 4000;
const aiPriceEstimate = base + rooms * 1500 + (furnished ? 2000 : 0);
```

The frontend shows `+X%` or `-X%` vs the AI estimate so tenants know if a price is fair.

---

## 🔐 User Roles

| Role     | Can Do                                              |
|----------|-----------------------------------------------------|
| Tenant   | Search, save, book viewings, review                 |
| Landlord | List properties, manage bookings, view analytics    |
| Admin    | Approve/reject listings, verify users, full access  |

---

## 📦 Deployment

**Frontend → Vercel:**
```bash
cd frontend && npm run build
# Deploy /dist to Vercel
```

**Backend → Railway / Render:**
```bash
cd backend && npm run build
# Set environment variables in Railway dashboard
# Start: node dist/server.js
```

**Database → MongoDB Atlas (free tier)**

---

## 🗺 Roadmap

- [ ] Cloudinary upload integration (direct from form)
- [ ] Real-time chat with Socket.io UI
- [ ] OpenStreetMap property map view
- [ ] Amharic / Oromo translation (i18n)
- [ ] AI fake listing detector
- [ ] SMS notifications (Twilio / Afro Message)
- [ ] Digital rent agreement (PDF generation)
- [ ] Mobile app (React Native)

---

## 💰 Monetization Plan

1. **Verification fee** — 200 birr/landlord to get the ✓ badge
2. **Featured listing** — 500 birr/month to appear at top
3. **Premium tenant** — saved searches, email alerts
4. **Property management** — subscription for multi-property landlords

---

Made with ❤️ in Ethiopia 🇪🇹
