# NCDA Trainings Management System Backend

A backend service for managing **trainings**, **trainers**, **trainees**, and **payments** in a Trainings Management System platform.  
Built with **Node.js, Express, Prisma, and PostgreSQL**.

This system provides **role-based authentication & authorization**, secure user management, and extensible APIs for future features.

---

## 🚀 Features

### ✅ Implemented

* **Authentication & Authorization**
  * Admin and Trainer roles
  * JWT-based authentication
  * Middleware for role-based access control
* **User Management**
  * Admins can invite trainers via email
  * Trainers activate accounts via email link and set password
  * Email verification system
  * Password reset flow (forgot + reset)
* **Security**
  * Password hashing (bcrypt)
  * Tokens with expiry for account activation & password recovery
* **Error Handling & Logging**
  * Centralized error handling
  * Structured logging with request/response tracking
* **Trainings Management**
  * Create, update, delete, and list trainings
  * Assign trainers to trainings
* **Trainer - Trainings - Trainees Management**
  * Add, update, remove, and list trainees for trainings
  * Bulk add trainees
* **Attendance Recording & Tracking**
  * (Feature placeholder for future extension)
* **Trainees Payments Recording**
  * Record, update, and list payments for trainees and trainings

---

## 🛠️ Tech Stack

* **Runtime**: [Node.js](https://nodejs.org/) (v18+)
* **Language**: [Typescript](https://www.typescriptlang.org/)
* **Framework**: [Express.js](https://expressjs.com/)
* **ORM**: [Prisma](https://www.prisma.io/)
* **Database**: MySQL
* **Authentication**: JWT
* **Email Service**: Nodemailer (configured with SMTP / Gmail)
* **Logging**: Winston
* **Validation**: Zod

---


## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Yonkuru/NCDA-Trainings.git
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root with the following:

```env
DATABASE_URL="mysql://user:password@localhost:3306/ncda_trainings"
PORT=5000

# JWT
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1d"

# Email (example: Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-password"
EMAIL_FROM="no-reply@your-email.com"
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed Admin Users

Seed initial **admin accounts**:

```bash
npx prisma db seed
```

The seed file will create at least one admin user with credentials specified inside `prisma/seed.ts`.

### 6. Start the Server

```bash
npm run dev   # for development (with nodemon)
npm run build && npm run start   # for production
```

---

## 🔑 Authentication Flow

### Registration & Email Verification

1. **Admin adds a trainer** → trainer’s email stored in DB with `isVerified=false`.
2. System sends **activation link** with token to trainer’s email.
3. Trainer clicks link → system verifies token.
4. Trainer sets password → account activated, role = `TRAINER`.

### Login

* Trainers & Admins login with email + password.
* Receives JWT token for protected routes.

### Role-Based Access

* **Admins**: Full system access (manage trainers, reports, etc.).
* **Trainers**: Limited access (dashboard, schedules, programs).

### Password Recovery

1. Trainer clicks **Forgot Password**.
2. Receives email with reset link.
3. Click link → enter new password.
4. System validates token and updates password.

---

## 📖 API Endpoints

### Auth Routes

| Method | Endpoint                | Description                        |
|--------|-------------------------|------------------------------------|
| POST   | `/api/auth/login`       | Login user                         |
| POST   | `/api/auth/invite-trainer` | Invite trainer (Admin only)     |
| POST   | `/api/auth/verify-email`   | Verify email & set password     |
| POST   | `/api/auth/forgot-password`| Request password reset           |
| POST   | `/api/auth/reset-password` | Complete password reset          |

### Training Routes

| Method | Endpoint                        | Description                                 |
|--------|---------------------------------|---------------------------------------------|
| GET    | `/api/trainings`                | List trainings (ADMIN sees all; TRAINER sees own) |
| POST   | `/api/trainings`                | Create training (Admin only)                |
| GET    | `/api/trainings/{id}`           | Get training by id (RBAC)                   |
| PATCH  | `/api/trainings/{id}`           | Update training (Admin only)                |
| DELETE | `/api/trainings/{id}`           | Delete training (Admin only)                |
| POST   | `/api/trainings/{id}/assign-trainer` | Assign trainer to training (Admin only) |

### Trainee Routes

| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| GET    | `/api/trainings/{id}/trainees`           | List trainees in a training (RBAC)          |
| POST   | `/api/trainings/{id}/trainees`           | Add one trainee to a training               |
| POST   | `/api/trainings/{id}/trainees/bulk`      | Bulk add trainees to a training             |
| PATCH  | `/api/trainees/{traineeId}`              | Update trainee                              |
| DELETE | `/api/trainees/{traineeId}`              | Remove trainee (Admin only)                 |

### Payment Routes

| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| POST   | `/api/trainings/{id}/payments`           | Record payment for a training               |
| GET    | `/api/trainings/{id}/payments`           | List payments for a training                |
| GET    | `/api/trainees/{traineeId}/payments`     | List payments for a trainee                 |
| PATCH  | `/api/payments/{paymentId}`              | Update payment details (Admin only)         |
| DELETE | `/api/payments/{paymentId}`              | Delete payment record (Admin only)          |

