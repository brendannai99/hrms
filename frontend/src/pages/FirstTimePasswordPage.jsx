import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function FirstTimePasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await api.put("/auth/first-time-password", {
                newPassword
            });

            setMessage(res.data.message);
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to set password");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Set Your New Password</h1>

                {message && <div className="message">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form className="form-layout" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            className="form-input"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                            <input
                                type="checkbox"
                                checked={showNewPassword}
                                onChange={() => setShowNewPassword(!showNewPassword)}
                            />
                            Show New Password
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            className="form-input"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                            <input
                                type="checkbox"
                                checked={showConfirmPassword}
                                onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                            Show Confirm Password
                        </label>
                    </div>

                    <div className="button-row-center">
                        <button className="btn btn-primary" type="submit">
                            Save New Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FirstTimePasswordPage;