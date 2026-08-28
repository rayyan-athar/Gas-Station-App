const express = require("express");
module.exports = function (db) {
    const router = express.Router();

    router.get("/", (req, res) => {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        db.all("SELECT * FROM associates WHERE user_id = ?", [req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    router.post("/", (req, res) => {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const { name, birthdate, ssn } = req.body;
        if (!name || !birthdate || !ssn) return res.status(400).json({ error: 'name, birthdate, ssn required' });
        const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
        if (!ssnPattern.test(ssn)) return res.status(400).json({ error: 'SSN must be XXX-XX-XXXX' });
        db.run(
            "INSERT INTO associates (name, birthdate, ssn, user_id) VALUES (?,?,?,?)",
            [name, birthdate, ssn, req.userId],
            function (err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'SSN must be unique' });
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ id: this.lastID });
            }
        );
    });

    router.put("/:id", (req, res) => {
        const { name, birthdate, ssn, hours_worked } = req.body;
        
        // If only hours_worked is provided, add to existing (for logging hours)
        if (hours_worked !== undefined && name === undefined && birthdate === undefined && ssn === undefined) {
            if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
            db.run(
                "UPDATE associates SET hours_worked = hours_worked + ? WHERE associate_id = ? AND user_id = ?",
                [hours_worked, req.params.id, req.userId],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    if (this.changes === 0) return res.status(404).json({ updated: false });
                    res.json({ updated: true });
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
            if (birthdate !== undefined) {
                updates.push("birthdate = ?");
                values.push(birthdate);
            }
            if (ssn !== undefined) {
                updates.push("ssn = ?");
                values.push(ssn);
            }
            if (hours_worked !== undefined) {
                updates.push("hours_worked = ?");
                values.push(hours_worked);
            }
            
            values.push(req.params.id);
            db.run(
                `UPDATE associates SET ${updates.join(", ")} WHERE associate_id = ? AND user_id = ?`,
                [...values, req.userId],
                function (err) {
                    if (err) {
                        if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'Constraint violation' });
                        return res.status(500).json({ error: err.message });
                    }
                    if (this.changes === 0) return res.status(404).json({ updated: false });
                    res.json({ updated: true });
                }
            );
        }
    });

    router.delete("/:id", (req, res) => {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        db.run("DELETE FROM associates WHERE associate_id = ? AND user_id = ?", [req.params.id, req.userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ deleted: false });
            res.json({ deleted: true });
        });
    });

    return router;
};
