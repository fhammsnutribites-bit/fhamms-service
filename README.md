# B2C E-commerce Platform

A full-stack B2C e-commerce application featuring separate user and admin panels, secure authentication, and MongoDB-backed data persistence.

## Tech Stack
- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)

## Features
- User authentication (Register, Login, Logout)
- Admin authentication (Separate panel)
- User: Browse products, cart, checkout, order history
- Admin: Product management, order management, user management

## Folder Structure
```
Project/
  client/    # React frontend
  server/    # Node.js/Express backend
```

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or Atlas)

### 1. Clone the Repository
```
git clone <repo-url>
cd Project
```

### 2. Backend Setup
```
cd server
npm install
# Create a .env file based on .env.example
npm run dev
```

### 3. Frontend Setup
```
cd client
npm install
npm start
```

### 4. Environment Variables

#### Backend (`server/.env`):
- `PORT=5000`
- `MONGO_URI=your-mongodb-uri`
- `JWT_SECRET=your_jwt_secret_key`

#### Frontend (`client/.env`):
- `REACT_APP_API_URL=http://localhost:5000`

---

## License
MIT

