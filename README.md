# Parkora AI

Parkora AI is a smart society parking and visitor management SaaS-style project built for Smartworld Gems. It supports role-based workflows for admins, guards, and residents, with automated parking allocation, visitor approvals, resident vehicle management, notifications, dynamic settings, and AI-driven parking insights.

## Overview

The app is designed around daily society parking operations:

- Admins manage parking slots, residents, approvals, settings, and operational insights.
- Guards create visitor entry requests, manage visitor exits, and monitor active parked vehicles.
- Residents manage their own vehicles, approve guard-created visitor requests, and invite visitors directly.

The product uses compact flat IDs and block-aware parking rules so allocation behavior matches the Smartworld Gems structure.

## Features

### Admin

- Operations dashboard
- Parking occupancy overview
- Pending resident registration approvals
- Residents list
- Recent activity
- Parking slot management
- AI insights dashboard
- Dynamic profile, notification, appearance, and society settings

### Guard

- Visitor entry request flow
- Flat-specific visitor entry requests
- Resident approval required before visitor parking allocation
- Visitor vehicle exit management
- Active visitor vehicle view
- Resident vehicle view
- Search for active vehicles by plate or owner
- Guard cannot exit resident-owned vehicles

### Resident

- Add resident vehicles
- Remove resident vehicles
- Automatic parking allocation by flat
- Invite visitors directly
- Visitor parking auto-allocation
- Entry approval requests
- Visitor history
- Assigned parking slots
- Separate views for own vehicles and visitor vehicles

### Parking Logic

- Society blocks:
  - Jade `J`
  - Topaz `T`
  - Nest `N`
  - Opal `O`
- Flat format examples:
  - `J112A`
  - `J112C`
  - `N22A`
- Floor mapping:
  - `A` = 1st floor
  - `B` = 2nd floor
  - `C` = 3rd floor
  - `D` = 4th floor
- Visitor parking is prioritized.
- If visitor parking is unavailable, unused resident parking can be used only when the flat has not been handed over.
- Reserved flat parking is inaccessible to everyone else.
- Reserved parking does not appear for guard visitor allocation.
- Resident vehicles use the flat-linked resident slot first.
- Additional resident vehicles use visitor parking first, then fallback resident parking if allowed.

### Notifications

- Dynamic notification flow across dashboards
- Registration approval updates
- Visitor request updates
- Parking allocation updates
- Vehicle entry and exit updates
- Settings update notifications
- Header notification dropdown
- Dashboard notification panels

### AI / ML

- Parking pressure insights
- Occupancy prediction
- Visitor demand signals
- Overstay and operational recommendations
- ML service integration through `ml-service`

## Tech Stack

### Frontend

- React
- Vite
- TanStack Router
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Recharts

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

### ML

- JavaScript-based parking pressure service in `ml-service`

## Project Structure

```txt
parkora-ai/
├── backend/
│   ├── app.js
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── services/
│   │   └── styles.css
│   └── package.json
│
└── ml-service/
```

## Environment Variables

Create a `.env` file inside `backend/`.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ritvikvermaa/parkora-ai.git
cd parkora-ai
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Running the App

### Start Backend

```bash
cd backend
npm start
```

Backend runs on:

```txt
http://localhost:3000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on:

```txt
http://localhost:8080
```

## Build

```bash
cd frontend
npm run build
```

## Authentication Flow

- New residents register from the login page.
- New registrations remain pending until approved by admin.
- Pending or rejected users cannot log in.
- Approved users are routed by role:
  - Admin -> `/admin`
  - Guard -> `/guard`
  - Resident -> `/dashboard`

## Main Routes

### Admin

```txt
/admin
/admin/operations
/admin/approvals
/admin/analytics
/admin/residents
/admin/activity
```

### Parking Slots

```txt
/slots
/slots/summary
/slots/search
/slots/jade
/slots/topaz
/slots/nest
/slots/opal
```

### Guard

```txt
/guard
/guard/entry
/guard/exit
/guard/search
/guard/visitors
/guard/residents
```

### Resident

```txt
/dashboard
/dashboard/vehicles
/dashboard/visitors
/dashboard/requests
/dashboard/history
/dashboard/slots
```

### AI Insights

```txt
/ai-insights
/ai-insights/pressure
/ai-insights/actions
/ai-insights/violations
/ai-insights/counts
```

### Settings

```txt
/settings
/settings/profile
/settings/appearance
/settings/notifications
/settings/society
```

## Important Notes

- Guard allocation is visitor-first and does not use resident parking unless fallback rules allow it.
- Resident-invited visitors do not require guard approval.
- Browser alerts are replaced with custom UI notices, popups, and inline states.
- Smartworld Gems is the configured society name.
- Flat IDs should use compact format such as `J112A` or `N22C`.

## Testing Checklist

Before deployment, test:

- Admin login
- Resident registration
- Admin approval / rejection
- Resident login after approval
- Guard visitor entry request
- Resident visitor approval
- Visitor parking allocation
- No-parking-available flow
- Resident vehicle add / remove
- Parking slot creation
- Notification updates
- Settings update
- AI insights dashboard
- Frontend build

## Project Status

This is a personal full-stack project focused on smart parking operations, visitor workflows, resident vehicle management, and dashboard-based society administration.
