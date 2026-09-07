# CampusStash
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A unified marketplace and lost & found platform built specifically for university students. CampusStash connects students on campus to buy, sell, trade, and recover lost items in a secure, real-time environment.

### 🌐 Live Demo
**Link: [campus-stash.vercel.app](https://campus-stash.vercel.app/)**
 - Email: testuser@g.bracu.ac.bd
 - Password: Testuser@123

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Routes](#api-routes)
- [Team](#team)
- [License](#license)

---

## Overview

University campuses are bustling hubs where students constantly need to buy or sell textbooks, electronics, and dorm essentials, or report lost belongings. Existing platforms are often cluttered, lack campus-specific filtering, and pose trust issues.

CampusStash solves this by providing a dedicated, student-first platform. With secure authentication, real-time messaging, and categorized listings for both marketplace goods and lost-and-found items, it streamlines campus commerce and community support into a single, cohesive application.

---

## Features

### Core Modules

| Feature | Description |
|---|---|
| **Secure Authentication** | JWT-secured auth flow including registration, login, password resets, and email verification to maintain a trusted student network. |
| **Dual-Mode Dashboard** | Seamlessly toggle between **Marketplace** (buy/sell) and **Lost & Found** feeds with advanced filtering and search capabilities. |
| **Real-Time Messaging** | Socket.io integrated chat system allowing users to negotiate prices or coordinate item returns instantly via dedicated message threads. |
| **Live Notifications** | Real-time alerts for new messages, listing updates, and platform events, managed through a dedicated notification center. |
| **Listing Management** | Create, edit, and manage personal listings with image upload support (processed via Multer). |
| **Bookmarking System** | Save interesting marketplace items or active lost-and-found posts for quick access later. |
| **Interactive UI** | Responsive, modern frontend featuring skeleton loaders, toast notifications, and intuitive confirmation dialogs. |

---

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Context API (State Management)
- Socket.io-client
- Tailwind CSS

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- Socket.io (Real-time WebSockets)
- JWT Authentication
- Multer (File uploads)
- Nodemailer (Email services)

---

## Project Structure

```text
campus-stash/
├── client/                     # React frontend
│   ├── src/
│   │   ├── assets/             # Static assets and SVGs
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/           # Login, Signup, and Auth Nav
│   │   │   ├── common/         # ConfirmDialogs, Loaders
│   │   │   ├── layout/         # MainNavbars and Footers
│   │   │   ├── marketplace/    # Item cards, Filters, Bookmarks
│   │   │   ├── messages/       # ChatThreadPanels
│   │   │   └── routing/        # Protected & Public Routes
│   │   ├── context/            # Auth and Notification Contexts
│   │   ├── hooks/              # Custom React hooks (useAuth)
│   │   ├── pages/              # Route-level view components
│   │   ├── services/           # Axios API integrations
│   │   └── utils/              # Socket config and formatters
│   └── vite.config.js
│
└── server/                     # Node.js backend
    ├── config/                 # Database configuration
    ├── controllers/            # Core business logic
    ├── middleware/             # Auth checks and Upload handlers
    ├── models/                 # Mongoose schemas (User, Item, Message)
    ├── routes/                 # Express API endpoint definitions
    ├── services/               # External services (Email)
    ├── utils/                  # Socket.io server instance
    └── server.js               # Application entry point
```

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas URI (or local instance)
- SMTP credentials (for email verification & password resets)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/evanmasrurjaber/campus-stash.git
   cd campus-stash
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Environment Variables

Create a `.env` file in both the `server` and `client` directories using the reference below.

**`server/.env`**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the App

Open two separate terminals:

**Terminal 1: Start the Backend**
```bash
cd server
npm run dev
```

**Terminal 2: Start the Frontend**
```bash
cd client
npm run dev
```

The frontend will run at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## API Routes

| Prefix | Methods | Description |
|---|---|---|
| `/api/auth` | `POST` | Registration, login, password reset, and email verification. |
| `/api/items` | `GET`, `POST`, `PUT`, `DELETE` | CRUD operations for marketplace and lost & found listings. |
| `/api/messages` | `GET`, `POST` | Retrieve chat threads and send new real-time messages. |
| `/api/notifications` | `GET`, `PUT` | Fetch notifications and update read status. |

*Note: Protected routes require a valid JWT passed in the Authorization header.*

---

## Team

- **Evan Masrur Jaber**
- **Mahmudul Hasan Tamal**
- **Raina Tabassum**

---

## License

This project is intended for academic and portfolio purposes. 
