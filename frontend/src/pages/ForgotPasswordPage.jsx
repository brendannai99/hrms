import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await api.post("/auth/request-password-reset", { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to request password reset");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Forgot Password</h1>

                {message && <div className="message">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form className="form-layout" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Work Email</label>
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="button-row-center">
                        <button className="btn btn-primary" type="submit">
                            Send Reset Link
                        </button>
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => navigate("/")}
                        >
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;