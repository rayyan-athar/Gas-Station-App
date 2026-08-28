const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const db = new sqlite3.Database(path.join(__dirname, "../db.sqlite"));

// Helper function to read and execute SQL file
function execSQLFile(filePath) {
    return new Promise((resolve, reject) => {
        const sql = fs.readFileSync(filePath, "utf8");
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function initDatabase() {
    try {
        console.log("Initializing database schema...");
        await execSQLFile(path.join(__dirname, "schema.sql"));
        console.log("Database schema initialized successfully!");

        // Ensure user_id columns exist (for cases where old DB predates schema change)
        const ensureColumn = (table, columnDef) => new Promise((resolve, reject) => {
            const [columnName] = columnDef.split(/\s+/);
            db.all(`PRAGMA table_info(${table})`, (err, rows) => {
                if (err) return reject(err);
                const exists = rows.some(r => r.name === columnName);
                if (exists) return resolve();
                db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`, (alterErr) => {
                    if (alterErr) return reject(alterErr);
                    resolve();
                });
            });
        });

        const columnPromises = [
            ensureColumn('products', 'user_id INTEGER'),
            ensureColumn('associates', 'user_id INTEGER'),
            ensureColumn('refill_stations', 'user_id INTEGER'),
            ensureColumn('tanks', 'user_id INTEGER'),
            ensureColumn('users', 'role TEXT DEFAULT \"associate\"')
        ];
        await Promise.all(columnPromises);
        console.log('Verified user_id columns.');
    } catch (error) {
        console.error("Error initializing database:", error);
    } finally {
        db.close();
    }
}

// Run the init function
initDatabase();


