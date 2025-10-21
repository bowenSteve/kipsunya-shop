# Kipsunya Shop

A full-stack e-commerce marketplace platform built with React and Django, featuring vendor management, product catalog, shopping cart, and order processing.

## Tech Stack

**Frontend:** React 19, React Router, TailwindCSS, Chart.js
**Backend:** Django 4.2+, Django REST Framework, PostgreSQL
**Additional:** Redis, Celery, JWT Authentication

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- PostgreSQL
- Redis (optional, for Celery tasks)

## Installation

### Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database (optional)
python manage.py runscript seed

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on `http://localhost:3000` and the backend API on `http://localhost:8000`.

## Project Structure

```
kipsunya-shop/
├── client/          # React frontend application
├── server/          # Django backend API
│   ├── admin_panel/ # Admin interface
│   ├── authentication/ # User authentication
│   ├── cart/        # Shopping cart functionality
│   ├── orders/      # Order management
│   └── products/    # Product catalog
└── design.txt       # Architecture documentation
```

## Available Scripts

### Frontend
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests

### Backend
- `python manage.py runserver` - Start Django server
- `python manage.py migrate` - Apply database migrations
- `python manage.py test` - Run tests

## Configuration

Create environment variables as needed:
- Frontend: `.env.development` / `.env.production` in `client/`
- Backend: Configure database settings in `server/server/settings.py`

## License

Private
