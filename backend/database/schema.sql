CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price REAL,
    category TEXT,
    shelf_location TEXT,
    user_id INTEGER
);

CREATE TABLE IF NOT EXISTS associates (
    associate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    birthdate TEXT,
    ssn TEXT UNIQUE,
    hours_worked REAL DEFAULT 0,
    user_id INTEGER
);

CREATE TABLE IF NOT EXISTS refill_stations (
    pump_number INTEGER PRIMARY KEY,
    tank_number INTEGER,
    user_id INTEGER
);

CREATE TABLE IF NOT EXISTS tanks (
    tank_number INTEGER PRIMARY KEY,
    capacity REAL,
    current_amount REAL,
    user_id INTEGER
);

-- Users table for authentication / multi-tenancy
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'associate',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes to speed up per-user queries
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_associates_user ON associates(user_id);
CREATE INDEX IF NOT EXISTS idx_refill_stations_user ON refill_stations(user_id);
CREATE INDEX IF NOT EXISTS idx_tanks_user ON tanks(user_id);
