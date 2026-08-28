const express = require("express");
module.exports = function (db) {
    const router = express.Router();

    router.get("/", (req, res) => {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        db.all(
            `SELECT * FROM refill_stations
             JOIN tanks ON refill_stations.tank_number = tanks.tank_number
             WHERE refill_stations.user_id = ? AND tanks.user_id = ?`,
            [req.userId, req.userId],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            }
        );
    });

    router.put("/:tank/refill", (req, res) => {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'amount must be positive number' });
        db.run(
            "UPDATE tanks SET current_amount = current_amount + ? WHERE tank_number = ? AND user_id = ?",
            [amount, req.params.tank, req.userId],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ refilled: false });
                res.json({ refilled: true });
            }
        );
    });

    return router;
};
