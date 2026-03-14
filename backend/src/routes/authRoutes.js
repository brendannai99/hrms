const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendPasswordResetEmail } = require("../utils/mailer");
const { addAuditLog } = require("../utils/auditLogger");

const router = express.Router();

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_DAYS = 7;

function dbQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

function createAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
}

function createRefreshTokenValue() {
    return crypto.randomBytes(64).toString("hex");
}

function createRefreshExpiryDate() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + REFRESH_TOKEN_DAYS);
    return expiry;
}

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const results = await dbQuery("SELECT * FROM employees WHERE email = ?", [email]);
        const user = results[0];

        if (!user) {
            await addAuditLog(null, "LOGIN_FAILED", "employee", null, {
                email,
                reason: "User not found",
                failedAttempt: 1
            }).catch(() => { });
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const now = new Date();

        if (user.locked_until && new Date(user.locked_until) > now) {
            await addAuditLog(user.id, "LOGIN_BLOCKED_LOCKED", "employee", user.id, {
                email: user.email,
                lockedUntil: user.locked_until
            }).catch(() => { });
            return res.status(423).json({
                error: "Account locked due to repeated failed login attempts. Try again later."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const nextFailedAttempts = (user.failed_login_attempts || 0) + 1;

            if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
                const lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

                await dbQuery(
                    "UPDATE employees SET failed_login_attempts = ?, locked_until = ? WHERE id = ?",
                    [nextFailedAttempts, lockedUntil, user.id]
                );

                await addAuditLog(user.id, "LOGIN_FAILED", "employee", user.id, {
                    email: user.email,
                    reason: "Incorrect password",
                    failedAttempt: nextFailedAttempts
                }).catch(() => { });

                await addAuditLog(user.id, "ACCOUNT_LOCKED", "employee", user.id, {
                    email: user.email,
                    failedAttempt: nextFailedAttempts,
                    lockedUntil
                }).catch(() => { });

                return res.status(423).json({
                    error: "Account locked due to repeated failed login attempts. Try again later."
                });
            }

            await dbQuery(
                "UPDATE employees SET failed_login_attempts = ?, locked_until = NULL WHERE id = ?",
                [nextFailedAttempts, user.id]
            );

            await addAuditLog(user.id, "LOGIN_FAILED", "employee", user.id, {
                email: user.email,
                reason: "Incorrect password",
                failedAttempt: nextFailedAttempts
            }).catch(() => { });

            return res.status(401).json({ error: "Invalid email or password" });
        }

        await dbQuery(
            "UPDATE employees SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
            [user.id]
        );

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshTokenValue();
        const refreshExpiry = createRefreshExpiryDate();

        await dbQuery(
            `INSERT INTO refresh_tokens (employee_id, token, expires_at, revoked)
             VALUES (?, ?, ?, 0)`,
            [user.id, refreshToken, refreshExpiry]
        );

        await addAuditLog(user.id, "LOGIN_SUCCESS", "employee", user.id, {
            email: user.email,
            role: user.role
        }).catch(() => { });

        res.json({
            message: "Login successful",
            token: accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                must_change_password: !!user.must_change_password
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
    }

    try {
        const tokenRows = await dbQuery(
            `SELECT rt.*, e.id AS employee_id, e.name, e.email, e.role, e.department, e.must_change_password
             FROM refresh_tokens rt
             JOIN employees e ON e.id = rt.employee_id
             WHERE rt.token = ?`,
            [refreshToken]
        );

        const storedToken = tokenRows[0];

        if (!storedToken) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        if (storedToken.revoked) {
            return res.status(401).json({ error: "Refresh token has been revoked" });
        }

        if (new Date(storedToken.expires_at) <= new Date()) {
            return res.status(401).json({ error: "Refresh token has expired" });
        }

        const newRefreshToken = createRefreshTokenValue();
        const newRefreshExpiry = createRefreshExpiryDate();

        await dbQuery(
            "UPDATE refresh_tokens SET revoked = 1 WHERE id = ?",
            [storedToken.id]
        );

        await dbQuery(
            `INSERT INTO refresh_tokens (employee_id, token, expires_at, revoked)
             VALUES (?, ?, ?, 0)`,
            [storedToken.employee_id, newRefreshToken, newRefreshExpiry]
        );

        const accessToken = createAccessToken({
            id: storedToken.employee_id,
            email: storedToken.email,
            role: storedToken.role
        });

        await addAuditLog(storedToken.employee_id, "REFRESH_TOKEN_ROTATED", "employee", storedToken.employee_id, {
            oldRefreshTokenId: storedToken.id
        }).catch(() => { });

        res.json({
            message: "Token refreshed successfully",
            token: accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: storedToken.employee_id,
                name: storedToken.name,
                email: storedToken.email,
                role: storedToken.role,
                department: storedToken.department,
                must_change_password: !!storedToken.must_change_password
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to refresh token" });
    }
});

router.post("/logout", authMiddleware, async (req, res) => {
    const { refreshToken } = req.body;

    try {
        if (refreshToken) {
            await dbQuery(
                "UPDATE refresh_tokens SET revoked = 1 WHERE token = ? AND employee_id = ?",
                [refreshToken, req.user.id]
            );
        }

        await addAuditLog(req.user.id, "LOGOUT", "employee", req.user.id, {}).catch(() => { });

        res.json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ error: "Failed to logout" });
    }
});

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const results = await dbQuery(
            "SELECT id, name, email, role, department, manager_id, created_at, must_change_password FROM employees WHERE id = ?",
            [req.user.id]
        );

        const user = results[0];

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.must_change_password = !!user.must_change_password;
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

router.put("/change-password", authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    try {
        const results = await dbQuery("SELECT * FROM employees WHERE id = ?", [req.user.id]);
        const user = results[0];

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Old password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateResult = await dbQuery(
            "UPDATE employees SET password = ?, must_change_password = 0 WHERE id = ?",
            [hashedPassword, req.user.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        await addAuditLog(req.user.id, "PASSWORD_CHANGED", "employee", req.user.id, {
            by: "self"
        }).catch(() => { });

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/first-time-password", authMiddleware, async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    try {
        const results = await dbQuery(
            "SELECT id, must_change_password FROM employees WHERE id = ?",
            [req.user.id]
        );
        const user = results[0];

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.must_change_password) {
            return res.status(400).json({ error: "First-time password change is not required" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateResult = await dbQuery(
            "UPDATE employees SET password = ?, must_change_password = 0 WHERE id = ?",
            [hashedPassword, req.user.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        await addAuditLog(req.user.id, "FIRST_TIME_PASSWORD_SET", "employee", req.user.id, {
            by: "self"
        }).catch(() => { });

        res.json({ message: "Password set successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/profile", authMiddleware, async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
    }

    try {
        const result = await dbQuery(
            "UPDATE employees SET name = ? WHERE id = ?",
            [name.trim(), req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        await addAuditLog(req.user.id, "PROFILE_UPDATED", "employee", req.user.id, {
            updatedFields: ["name"]
        }).catch(() => { });

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});

router.post("/request-password-reset", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const results = await dbQuery("SELECT * FROM employees WHERE email = ?", [email]);
        const user = results[0];

        if (!user) {
            return res.status(404).json({ error: "Email not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const updateResult = await dbQuery(
            "UPDATE employees SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
            [resetToken, expiry, user.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        await addAuditLog(user.id, "PASSWORD_RESET_REQUESTED", "employee", user.id, {
            email: user.email
        }).catch(() => { });

        await sendPasswordResetEmail(user.email, resetLink);
        res.json({ message: "Password reset link sent to email" });
    } catch (error) {
        res.status(500).json({ error: "Failed to process request" });
    }
});

router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    try {
        const results = await dbQuery(
            "SELECT * FROM employees WHERE reset_token = ?",
            [token]
        );
        const user = results[0];

        if (!user) {
            return res.status(400).json({ error: "Invalid reset token" });
        }

        const now = new Date();
        const expiry = new Date(user.reset_token_expiry);

        if (now > expiry) {
            return res.status(400).json({ error: "Reset token has expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateResult = await dbQuery(
            "UPDATE employees SET password = ?, reset_token = NULL, reset_token_expiry = NULL, must_change_password = 0 WHERE id = ?",
            [hashedPassword, user.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        await addAuditLog(user.id, "PASSWORD_RESET_COMPLETED", "employee", user.id, {
            method: "reset_token"
        }).catch(() => { });

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to reset password" });
    }
});

module.exports = router;