# Dayflow HRMS Backend

A Node.js/Express backend for the Dayflow Human Resource Management System.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Employee Management**: Complete profile management with job details and salary structure
- **Attendance Tracking**: Check-in/check-out with automatic time calculation
- **Leave Management**: Leave requests with approval workflow
- **Payroll System**: Monthly payroll generation and management
- **Real-time Notifications**: Socket.IO integration for live updates
- **File Upload**: Secure document upload and management
- **Reporting**: Comprehensive attendance and leave reports

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express Validator

## Project Structure

```
backend/
├── models/           # Mongoose models
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── utils/           # Utility functions
├── uploads/         # File upload directory
├── server.js        # Main server file
├── package.json     # Dependencies
└── .env            # Environment variables
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
MONGO_URL=mongodb://localhost:27017/dayflow
DB_NAME=dayflow
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
CORS_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@dayflow.com
PORT=8000
```

3. Start MongoDB service

4. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user

### Profiles
- `POST /api/profiles` - Create profile
- `GET /api/profiles/me` - Get my profile
- `PUT /api/profiles/me` - Update my profile
- `GET /api/profiles/employees` - Get all employees (Admin/HR)
- `GET /api/profiles/employees/:id` - Get employee by ID (Admin/HR)
- `PUT /api/profiles/employees/:id` - Update employee (Admin/HR)

### Attendance
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/me` - Get my attendance
- `GET /api/attendance` - Get all attendance (Admin/HR)
- `PUT /api/attendance/:id` - Update attendance (Admin/HR)

### Leaves
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves/me` - Get my leaves
- `GET /api/leaves` - Get all leaves (Admin/HR)
- `PUT /api/leaves/:id` - Update leave status (Admin/HR)

### Payroll
- `GET /api/payroll/me` - Get my payroll
- `GET /api/payroll` - Get all payroll (Admin/HR)
- `POST /api/payroll` - Create payroll (Admin/HR)
- `PUT /api/payroll/:id` - Update payroll (Admin/HR)

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Upload
- `POST /api/upload` - Upload file
- `GET /api/upload/files/:filename` - Get file
- `DELETE /api/upload/files/:filename` - Delete file

### Reports
- `GET /api/reports/attendance` - Attendance report (Admin/HR)
- `GET /api/reports/leaves` - Leave report (Admin/HR)
- `GET /api/reports/employee-summary` - Employee summary (Admin/HR)

## User Roles

- **Admin**: Full system access
- **HR**: Employee management, attendance, leaves, payroll
- **Employee**: Personal profile, attendance, leave requests

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- File upload restrictions

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/dayflow` |
| `DB_NAME` | Database name | `dayflow` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for emails | `http://localhost:3000` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USER` | Email username | Required |
| `SMTP_PASS` | Email password | Required |
| `FROM_EMAIL` | From email address | `noreply@dayflow.com` |
| `PORT` | Server port | `8000` |