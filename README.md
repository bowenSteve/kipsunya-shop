# Multi-Vendor E-commerce Platform

A full-stack product marketplace with tiered vendor system, built with Django REST Framework and React.

## Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL

## Backend Setup

Navigate to server directory:
```bash
cd server
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run migrations:
```bash
python manage.py migrate
```

Seed the database:
```bash
python seed.py
```

Start the server:
```bash
python manage.py runserver
```

Backend runs at `http://localhost:8000`

## Frontend Setup

Navigate to client directory:
```bash
cd client
```

Create environment file:
```bash
# Create .env.development with:
REACT_APP_API_URL=http://localhost:8000
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```

Frontend runs at `http://localhost:3000`

## Features

- Role-based access control (Customer, Vendor, Admin)
- Vendor tier system with product limits
- Shopping cart with tax calculations
- Product analytics tracking
- Admin dashboard with Chart.js
- JWT authentication with token blacklisting

## Tech Stack

**Frontend:** React 19, React Router, Chart.js, Context API

**Backend:** Django REST Framework, PostgreSQL, JWT Authentication
