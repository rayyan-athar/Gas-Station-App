const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, "db.sqlite"));

// Ensure schema and required columns are present on startup (auto-migration)
function ensureSchema() {
	return new Promise((resolve) => {
		// Create users table if missing
		db.run(
			`CREATE TABLE IF NOT EXISTS users (
				user_id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP
			)`,
			() => {
				// Add user_id columns if missing
				const alters = [
					"ALTER TABLE products ADD COLUMN user_id INTEGER",
					"ALTER TABLE associates ADD COLUMN user_id INTEGER",
					"ALTER TABLE tanks ADD COLUMN user_id INTEGER",
					"ALTER TABLE refill_stations ADD COLUMN user_id INTEGER",
				];
				let idx = 0;
				function next() {
					if (idx >= alters.length) return resolve();
					db.run(alters[idx], (err) => {
						// Ignore errors if column exists
						idx++;
						next();
					});
				}
				next();
			}
		);
	});
}

(async () => {
	await ensureSchema();
})();

// Public auth routes
app.use('/auth', require('./routes/auth')(db));

// Auth middleware for protected resources
const auth = require('./middleware/auth');

// Protected data routes (require JWT)
app.use("/products", auth, require("./routes/products")(db));
app.use("/associates", auth, require("./routes/associates")(db));
app.use("/stations", auth, require("./routes/stations")(db));

const PORT = 4000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
