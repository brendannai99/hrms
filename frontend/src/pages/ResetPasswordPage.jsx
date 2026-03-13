import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await api.post("/auth/reset-password", {
                token,
                newPassword
            });

            setMessage(res.data.message);

            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to reset password");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Reset Password</h1>

                {message && <div className="message">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form className="form-layout" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="button-row-center">
                        <button className="btn btn-primary" type="submit">
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordPage;