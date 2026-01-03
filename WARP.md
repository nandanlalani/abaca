# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Dayflow HRMS is a full-stack Human Resource Management System built with React 19 frontend and Node.js/Express backend, using MongoDB for data storage and Socket.IO for real-time features.

## Development Commands

### Backend (Node.js/Express)
```powershell
cd backend
npm install                  # Install dependencies
npm run dev                  # Start development server with nodemon (port 8000)
npm start                    # Start production server
npm test                     # Run tests with Jest
npm run seed                 # Seed database with demo data
```

### Frontend (React)
```powershell
cd frontend
npm install                  # Install dependencies
npm start                    # Start development server (port 3000)
npm run build                # Build for production
npm test                     # Run tests
```

### Database
- MongoDB connection required (MongoDB Atlas or local instance)
- Default connection: `mongodb://localhost:27017/dayflow`
- Seed demo users: `admin@dayflow.com / Admin123`, `hr@dayflow.com / HR123`, `john.doe@dayflow.com / Employee123`

## Architecture Overview

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Refresh token flow**: Automatic token refresh via axios interceptors in `frontend/src/utils/api.js`
- **Role-based access control**: `admin`, `hr`, `employee` roles with different permissions
- **Protected routes**: Frontend uses `ProtectedRoute` component with `adminOnly` prop for admin/HR pages
- User state managed globally via `AuthContext` (`frontend/src/contexts/AuthContext.js`)

### Real-time Communication
- **Socket.IO** integration for live notifications
- Backend initializes Socket.IO server in `server.js` and makes `io` available to routes via `app.set('io', io)`
- Frontend `SocketContext` (`frontend/src/contexts/SocketContext.js`) manages socket connection and listens for `notification` events
- Notifications displayed using `sonner` toast library

### Data Models (Backend)
All models use UUIDs for primary keys and are located in `backend/models/`:
- **User**: Authentication, roles, email verification, password reset
- **Profile**: Employee details, job info, salary structure, emergency contacts, documents
- **Attendance**: Check-in/check-out tracking with automatic time calculations
- **Leave**: Leave requests with approval workflow (types: sick, casual, annual, maternity, paternity)
- **Payroll**: Monthly payroll with basic, HRA, allowances, deductions
- **Notification**: Real-time notifications with read status
- **AuditLog**: Activity tracking (if implemented)

### API Structure
- All API routes prefixed with `/api/`
- Route files in `backend/routes/`:
  - `auth.js`: Signup, signin, password reset, email verification, refresh token
  - `profiles.js`: Employee profile management
  - `attendance.js`: Check-in/out, attendance records
  - `leaves.js`: Leave applications and approvals
  - `payroll.js`: Payroll generation and management
  - `notifications.js`: Notification CRUD operations
  - `upload.js`: File upload with Multer
  - `reports.js`: Attendance, leave, and employee summary reports
- Middleware in `backend/middleware/` for authentication, validation, and authorization

### Frontend Structure
- **React Router DOM** for navigation
- **Context API** for global state:
  - `AuthContext`: User authentication and profile
  - `SocketContext`: Real-time socket connection
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-level components in `src/pages/`
  - Admin pages: `AdminDashboard`, `Employees`, `AdminAttendance`, `AdminLeaves`, `AdminPayroll`, `Reports`
  - Employee pages: `EmployeeDashboard`, `Profile`, `Attendance`, `Leave`, `Payroll`
- **Custom hooks**: `src/hooks/` for reusable logic
- **Utils**: API client with interceptors in `src/utils/api.js`

### Design System: "Organic Swiss"

The application strictly follows a professional design system defined in `design_guidelines.json`:

**Typography:**
- Headings: Manrope (600, 700, 800 weights) with `tracking-tight`
- Body text: Public Sans (400, 500 weights)
- Monospace: JetBrains Mono for code/IDs

**Colors:**
- Professional slate foundation (`#F8FAFC` background, `#0F172A` primary)
- Brand accent: `#4F46E5`
- NO purple/teal gradients, NO Inter font for headings

**Layout Patterns:**
- **Admin Dashboard**: "Control Room" grid - `grid-cols-1 md:grid-cols-3 lg:grid-cols-4` - dense, data-heavy
- **Employee Dashboard**: "Tetris Grid" - `grid-cols-1 md:grid-cols-8 lg:grid-cols-12` - asymmetric with hero cards
- Generous spacing: use `p-6`, `p-8`, `p-12` (avoid `p-2` or `p-4`)

**UI Components:**
- Built with **Radix UI primitives** for accessibility
- **Shadcn/ui** component patterns
- Icons from **lucide-react** with `stroke-width={1.5} size={20}`
- Toasts with **sonner**
- Forms with **React Hook Form** + **Zod** validation
- Charts with **Recharts**

**Testing Requirements:**
- ALL interactive elements MUST have `data-testid` attribute in kebab-case format (e.g., `login-submit-btn`)

**File Conventions:**
- React components use `.jsx` or `.js` extensions (project uses `.js`)
- Use **named exports** for components, **default exports** for pages

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017/dayflow
DB_NAME=dayflow
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@dayflow.com
PORT=8000
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Key Integration Points

### API Client Configuration
The `frontend/src/utils/api.js` file configures axios with:
- Automatic Bearer token injection from localStorage
- 401 response interceptor for automatic token refresh
- Redirects to `/signin` on refresh failure

### Socket.IO Integration
- Backend creates server in `server.js` with CORS configuration
- Routes access Socket.IO via `req.app.get('io')` to emit notifications
- Frontend connects on user login and joins user-specific room with `socket.emit('join', userId)`

### File Upload
- Uses **Multer** middleware for file handling
- Uploads stored in `backend/uploads/` directory
- Files associated with profiles in documents array

## Common Development Patterns

### Creating New API Endpoints
1. Define route handler in appropriate route file (`backend/routes/`)
2. Add authentication middleware if protected
3. Use express-validator for input validation
4. Return consistent response format: `{ success: boolean, data?, message?, errors? }`

### Adding Frontend Features
1. Create page component in `src/pages/` or reusable component in `src/components/`
2. Add route in `App.js` with `ProtectedRoute` wrapper if authentication required
3. Use `useAuth()` hook for user context
4. Use `api` client from `utils/api.js` for backend calls
5. Follow "Organic Swiss" design system from `design_guidelines.json`

### Database Operations
- All models use Mongoose ODM
- IDs are UUIDs (not MongoDB ObjectIds) generated via `uuid` package
- Timestamps handled automatically via schema option: `{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }`

## Windows-Specific Notes
- Use PowerShell commands shown above
- Path separators are backslashes (`\`) but Node.js handles both
- Ensure MongoDB service is running before starting backend
