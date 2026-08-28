const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const db = new sqlite3.Database(path.join(__dirname, "../db.sqlite"));

// Helper function to run SQL queries
function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

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

async function seedDatabase() {
    try {
        console.log("Starting database seeding...");
        
        // Initialize schema first
        console.log("Initializing database schema...");
        await execSQLFile(path.join(__dirname, "schema.sql"));
        console.log("Schema initialized successfully");

        // Clear existing data (delete in order to respect foreign key constraints)
        await runQuery("DELETE FROM products");
        await runQuery("DELETE FROM associates");
        await runQuery("DELETE FROM refill_stations");
        await runQuery("DELETE FROM tanks");

        // Reset auto-increment counters
        await runQuery("DELETE FROM sqlite_sequence WHERE name IN ('products', 'associates')");

        // Seed Products
        const products = [
            { name: "Coca-Cola 12oz", quantity: 150, price: 1.99, category: "Beverages", shelf_location: "Aisle 1, Shelf 3" },
            { name: "Pepsi 12oz", quantity: 120, price: 1.99, category: "Beverages", shelf_location: "Aisle 1, Shelf 3" },
            { name: "Water Bottle 16oz", quantity: 200, price: 1.49, category: "Beverages", shelf_location: "Aisle 1, Shelf 1" },
            { name: "Energy Drink", quantity: 80, price: 3.49, category: "Beverages", shelf_location: "Aisle 1, Shelf 4" },
            { name: "Coffee Cup", quantity: 50, price: 2.99, category: "Beverages", shelf_location: "Counter" },
            { name: "Lay's Classic Chips", quantity: 75, price: 2.99, category: "Snacks", shelf_location: "Aisle 2, Shelf 2" },
            { name: "Doritos Nacho Cheese", quantity: 60, price: 3.49, category: "Snacks", shelf_location: "Aisle 2, Shelf 2" },
            { name: "M&M's Chocolate", quantity: 90, price: 2.49, category: "Candy", shelf_location: "Aisle 2, Shelf 4" },
            { name: "Snickers Bar", quantity: 100, price: 1.79, category: "Candy", shelf_location: "Aisle 2, Shelf 4" },
            { name: "Twix Bar", quantity: 85, price: 1.79, category: "Candy", shelf_location: "Aisle 2, Shelf 4" },
            { name: "Sandwich - Turkey", quantity: 25, price: 5.99, category: "Food", shelf_location: "Cooler A" },
            { name: "Sandwich - Ham", quantity: 20, price: 5.99, category: "Food", shelf_location: "Cooler A" },
            { name: "Hot Dog", quantity: 30, price: 3.99, category: "Food", shelf_location: "Hot Counter" },
            { name: "Pizza Slice", quantity: 15, price: 4.99, category: "Food", shelf_location: "Hot Counter" },
            { name: "Motor Oil 5W-30", quantity: 40, price: 24.99, category: "Automotive", shelf_location: "Aisle 3, Shelf 1" },
            { name: "Windshield Washer Fluid", quantity: 35, price: 4.99, category: "Automotive", shelf_location: "Aisle 3, Shelf 2" },
            { name: "Air Freshener", quantity: 50, price: 3.99, category: "Automotive", shelf_location: "Aisle 3, Shelf 3" },
            { name: "Ice Scraper", quantity: 20, price: 5.99, category: "Automotive", shelf_location: "Aisle 3, Shelf 4" },
            { name: "Cigarettes - Marlboro", quantity: 45, price: 8.99, category: "Tobacco", shelf_location: "Behind Counter" },
            { name: "Cigarettes - Camel", quantity: 40, price: 8.99, category: "Tobacco", shelf_location: "Behind Counter" },
            { name: "Newspaper", quantity: 30, price: 2.50, category: "Media", shelf_location: "Front Counter" },
            { name: "Magazine - Sports", quantity: 15, price: 4.99, category: "Media", shelf_location: "Front Counter" },
            { name: "Gum - Spearmint", quantity: 60, price: 1.29, category: "Candy", shelf_location: "Aisle 2, Shelf 1" },
            { name: "Gum - Peppermint", quantity: 55, price: 1.29, category: "Candy", shelf_location: "Aisle 2, Shelf 1" },
            { name: "Beef Jerky", quantity: 45, price: 6.99, category: "Snacks", shelf_location: "Aisle 2, Shelf 3" }
        ];

        console.log("Inserting products...");
        for (const product of products) {
            await runQuery(
                "INSERT INTO products (name, quantity, price, category, shelf_location) VALUES (?, ?, ?, ?, ?)",
                [product.name, product.quantity, product.price, product.category, product.shelf_location]
            );
        }
        console.log(`Inserted ${products.length} products`);

        // Seed Associates
        const associates = [
            { name: "John Smith", birthdate: "1990-05-15", ssn: "123-45-6789", hours_worked: 40.0 },
            { name: "Sarah Johnson", birthdate: "1988-08-22", ssn: "234-56-7890", hours_worked: 35.5 },
            { name: "Michael Brown", birthdate: "1995-03-10", ssn: "345-67-8901", hours_worked: 25.0 },
            { name: "Emily Davis", birthdate: "1992-11-30", ssn: "456-78-9012", hours_worked: 30.0 },
            { name: "David Wilson", birthdate: "1987-07-18", ssn: "567-89-0123", hours_worked: 40.0 },
            { name: "Jessica Martinez", birthdate: "1994-01-25", ssn: "678-90-1234", hours_worked: 20.0 },
            { name: "Robert Taylor", birthdate: "1991-09-12", ssn: "789-01-2345", hours_worked: 38.5 },
            { name: "Amanda Anderson", birthdate: "1993-06-08", ssn: "890-12-3456", hours_worked: 32.0 },
            { name: "Christopher Thomas", birthdate: "1989-12-03", ssn: "901-23-4567", hours_worked: 40.0 },
            { name: "Michelle Jackson", birthdate: "1996-04-20", ssn: "012-34-5678", hours_worked: 15.0 }
        ];

        console.log("Inserting associates...");
        for (const associate of associates) {
            await runQuery(
                "INSERT INTO associates (name, birthdate, ssn, hours_worked) VALUES (?, ?, ?, ?)",
                [associate.name, associate.birthdate, associate.ssn, associate.hours_worked]
            );
        }
        console.log(`Inserted ${associates.length} associates`);

        // Seed Tanks (must be created before refill_stations due to foreign key relationship)
        const tanks = [
            { tank_number: 1, capacity: 10000, current_amount: 7500 },
            { tank_number: 2, capacity: 10000, current_amount: 8200 },
            { tank_number: 3, capacity: 8000, current_amount: 4500 },
            { tank_number: 4, capacity: 8000, current_amount: 6200 },
            { tank_number: 5, capacity: 12000, current_amount: 9800 },
            { tank_number: 6, capacity: 12000, current_amount: 11000 }
        ];

        console.log("Inserting tanks...");
        for (const tank of tanks) {
            await runQuery(
                "INSERT INTO tanks (tank_number, capacity, current_amount) VALUES (?, ?, ?)",
                [tank.tank_number, tank.capacity, tank.current_amount]
            );
        }
        console.log(`Inserted ${tanks.length} tanks`);

        // Seed Refill Stations
        const stations = [
            { pump_number: 1, tank_number: 1 },
            { pump_number: 2, tank_number: 1 },
            { pump_number: 3, tank_number: 2 },
            { pump_number: 4, tank_number: 2 },
            { pump_number: 5, tank_number: 3 },
            { pump_number: 6, tank_number: 3 },
            { pump_number: 7, tank_number: 4 },
            { pump_number: 8, tank_number: 4 },
            { pump_number: 9, tank_number: 5 },
            { pump_number: 10, tank_number: 5 },
            { pump_number: 11, tank_number: 6 },
            { pump_number: 12, tank_number: 6 }
        ];

        console.log("Inserting refill stations...");
        for (const station of stations) {
            await runQuery(
                "INSERT INTO refill_stations (pump_number, tank_number) VALUES (?, ?)",
                [station.pump_number, station.tank_number]
            );
        }
        console.log(`Inserted ${stations.length} refill stations`);

        console.log("Database seeding completed successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        db.close();
    }
}

// Run the seed function
seedDatabase();

