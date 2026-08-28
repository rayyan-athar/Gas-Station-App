const express = require("express");
module.exports = function (db) {
    const router = express.Router();

    router.get("/", (req, res) => {
            if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
            db.all("SELECT * FROM products WHERE user_id = ?", [req.userId], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            });
        });

    router.post("/", (req, res) => {
        const { name, quantity = 0, price = null, category = null, shelf_location = null } = req.body;
        if (!name) return res.status(400).json({ error: "Missing required field: name" });

        db.run(
                "INSERT INTO products (name, quantity, price, category, shelf_location, user_id) VALUES (?,?,?,?,?,?)",
                [name, quantity, price, category, shelf_location, req.userId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID });
            }
        );
    });

    router.put("/:id", (req, res) => {
        const { name, quantity, price, category, shelf_location } = req.body;
        
        // If only quantity is provided, add to existing (for refill/restock)
        if (quantity !== undefined && name === undefined && price === undefined && category === undefined && shelf_location === undefined) {
                if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
            db.run(
                    "UPDATE products SET quantity = quantity + ? WHERE product_id = ? AND user_id = ?",
                    [quantity, req.params.id, req.userId],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    if (this.changes === 0) return res.status(404).json({ updated: false });
                    return res.json({ updated: true });
                }
            );
        } else {
            // Full update
            const updates = [];
            const values = [];
            
            if (name !== undefined) {
                updates.push("name = ?");
                values.push(name);
            }
            if (quantity !== undefined) {
                updates.push("quantity = ?");
                values.push(quantity);
            }
            if (price !== undefined) {
                updates.push("price = ?");
                values.push(price);
            }
            if (category !== undefined) {
                updates.push("category = ?");
                values.push(category);
            }
            if (shelf_location !== undefined) {
                updates.push("shelf_location = ?");
                values.push(shelf_location);
            }
            // reorder_threshold removed
            
            if (updates.length === 0) return res.status(400).json({ error: "No valid fields provided for update" });
            values.push(req.params.id);
            db.run(
                    `UPDATE products SET ${updates.join(", ")} WHERE product_id = ? AND user_id = ?`,
                    [...values, req.userId],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    if (this.changes === 0) return res.status(404).json({ updated: false });
                    res.json({ updated: true });
                }
            );
        }
    });

    // CSV bulk import removed

    router.delete("/:id", (req, res) => {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        db.run("DELETE FROM products WHERE product_id = ? AND user_id = ?", [req.params.id, req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ deleted: false });
            res.json({ deleted: true });
        });
    });

    return router;
};
