# Gas Station Management Application

A full-stack web application for managing gas station operations including inventory, employees, and fuel stations.

## Features

- **Products Management**: Add, update, delete, and restock store products
- **Associates Management**: Manage employees with full CRUD operations and work hour tracking
- **Gas Stations Management**: Monitor fuel tanks and refill stations

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Quick Setup (Recommended)

Run the automated setup script:
```bash
./setup.sh
```

This will:
- Check for Node.js installation
- Install all dependencies (backend and frontend)
- Seed the database with dummy data

### Manual Installation

If you prefer to set up manually:

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ..
   npm install
   ```

3. **Initialize and seed the database:**
   ```bash
   cd backend
   npm run seed
   ```
   This will create all tables and populate them with dummy data.

### Running the Application

You need to run both the backend and frontend servers in separate terminals:

**Option 1: Using the start scripts (easiest)**

1. **Start the backend server** (Terminal 1):
   ```bash
   ./start-backend.sh
   ```
   The backend will run on `http://localhost:4000`

2. **Start the frontend server** (Terminal 2):
   ```bash
   ./start-frontend.sh
   ```
   The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

**Option 2: Manual start**

1. **Start the backend server** (Terminal 1):
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:4000`

2. **Start the frontend server** (Terminal 2):
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

3. **Open your browser** and navigate to the frontend URL (usually `http://localhost:5173`)

## Database Scripts

- `npm run init` - Initialize database schema only (no data)
- `npm run seed` - Initialize schema and populate with dummy data

## Project Structure

```
gas-station-app-main/
├── backend/
│   ├── database/
│   │   ├── schema.sql      # Database schema
│   │   ├── init.js         # Initialize database script
│   │   └── seed.js         # Seed database with dummy data
│   ├── routes/
│   │   ├── products.js     # Products API routes
│   │   ├── associates.js   # Associates API routes
│   │   └── stations.js     # Stations API routes
│   ├── server.js           # Express server
│   └── db.sqlite           # SQLite database (created after seeding)
├── src/
│   ├── pages/
│   │   ├── Products.jsx    # Products management page
│   │   ├── Associates.jsx  # Associates management page
│   │   └── Stations.jsx    # Stations management page
│   ├── components/
│   │   └── NavBar.jsx      # Navigation component
│   ├── api.js              # API client functions
│   └── App.jsx             # Main app component
└── package.json
```

## API Endpoints

### Products
- `GET /products` - Get all products
- `POST /products` - Add a new product
- `PUT /products/:id` - Update a product (full update or restock)
- `DELETE /products/:id` - Delete a product

### Associates
- `GET /associates` - Get all associates
- `POST /associates` - Add a new associate
- `PUT /associates/:id` - Update an associate (full update or add hours)
- `DELETE /associates/:id` - Delete an associate

### Stations
- `GET /stations` - Get all stations with tank information
- `PUT /stations/:tank/refill` - Refill a tank

## Usage

1. **Products Page**: Manage store inventory - add products, update details, restock items, or remove products
2. **Associates Page**: Manage employees - add associates, update information, log work hours, or remove associates
3. **Stations Page**: Monitor fuel tanks - view tank levels and refill tanks as needed
