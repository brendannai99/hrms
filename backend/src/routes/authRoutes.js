const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPasswordResetEmail } = require("../utils/mailer");

const router = express.Router();

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    db.get("SELECT * FROM employees WHERE email = ?", [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Login failed" });
        }

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }
            });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    });
});

router.get("/me", authMiddleware, (req, res) => {
    db.get(
        "SELECT id, name, email, role, department, manager_id, created_at FROM employees WHERE id = ?",
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch user" });
            }

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json(user);
        }
    );
});

router.put("/change-password", authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    db.get("SELECT * FROM employees WHERE id = ?", [req.user.id], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch user" });
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        try {
            const isMatch = await bcrypt.compare(oldPassword, user.password);

            if (!isMatch) {
                return res.status(401).json({ error: "Old password is incorrect" });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            db.run(
                "UPDATE employees SET password = ? WHERE id = ?",
                [hashedPassword, req.user.id],
                function (updateErr) {
                    if (updateErr) {
                        return res.status(500).json({ error: "Failed to update password" });
                    }

                    res.json({ message: "Password changed successfully" });
                }
            );
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    });
});

router.put("/profile", authMiddleware, (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
    }

    db.run(
        "UPDATE employees SET name = ? WHERE id = ?",
        [name.trim(), req.user.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to update profile" });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            return res.json({ message: "Profile updated successfully" });
        }
    );
});

router.post("/request-password-reset", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    db.get("SELECT * FROM employees WHERE email = ?", [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Failed to process request" });
        }

        if (!user) {
            return res.status(404).json({ error: "Email not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        db.run(
            "UPDATE employees SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
            [resetToken, expiry, user.id],
            async function (updateErr) {
                if (updateErr) {
                    return res.status(500).json({ error: "Failed to save reset token" });
                }

                try {
                    await sendPasswordResetEmail(user.email, resetLink);
                    res.json({ message: "Password reset link sent to email" });
                } catch (mailErr) {
                    console.error("Email send failed:", mailErr);
                    res.status(500).json({ error: "Failed to send reset email" });
                }
            }
        );
    });
});

router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    db.get(
        "SELECT * FROM employees WHERE reset_token = ?",
        [token],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: "Failed to reset password" });
            }

            if (!user) {
                return res.status(400).json({ error: "Invalid reset token" });
            }

            const now = new Date();
            const expiry = new Date(user.reset_token_expiry);

            if (now > expiry) {
                return res.status(400).json({ error: "Reset token has expired" });
            }

            try {
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                db.run(
                    `
            UPDATE employees
            SET password = ?, reset_token = NULL, reset_token_expiry = NULL
            WHERE id = ?
          `,
                    [hashedPassword, user.id],
                    function (updateErr) {
                        if (updateErr) {
                            return res.status(500).json({ error: "Failed to update password" });
                        }

                        res.json({ message: "Password reset successfully" });
                    }
                );
            } catch (error) {
                res.status(500).json({ error: "Server error" });
            }
        }
    );
});

module.exports = router;