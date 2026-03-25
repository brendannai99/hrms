import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await api.put("/auth/change-password", {
                oldPassword,
                newPassword
            });

            setMessage(res.data.message);
            setOldPassword("");
            setNewPassword("");

            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to change password");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Change Password</h1>

                {message && <div className="message">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form className="form-layout" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Old Password</label>
                        <input
                            className="form-input"
                            type={showOldPassword ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                            <input
                                type="checkbox"
                                checked={showOldPassword}
                                onChange={() => setShowOldPassword(!showOldPassword)}
                            />
                            Show Old Password
                        </label>
                    </div>

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

                    <div className="button-row-center">
                        <button className="btn btn-primary" type="submit">
                            Change Password
                        </button>

                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => navigate("/dashboard")}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordPage;