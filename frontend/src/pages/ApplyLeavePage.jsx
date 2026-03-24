import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ApplyLeavePage() {
    const [form, setForm] = useState({
        leave_type: "annual",
        start_date: "",
        end_date: "",
        half_day: "none",
        reason: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await api.post("/leave/apply", form);
            setMessage(res.data.message);
            setForm({
                leave_type: "annual",
                start_date: "",
                end_date: "",
                half_day: "none",
                reason: ""
            });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to apply leave");
        }
    };

    return (
        <div className="page-container leave-page">
            <div className="card-narrow leave-card">
                <h1 className="page-title">Apply Leave</h1>

                {message && <p className="message-success">{message}</p>}
                {error && <p className="message-error">{error}</p>}

                <form onSubmit={handleSubmit} className="leave-form">
                    <div className="leave-grid">
                        <div className="field-group">
                            <label className="form-label">Leave Type</label>
                            <select
                                className="input-field"
                                name="leave_type"
                                value={form.leave_type}
                                onChange={handleChange}
                            >
                                <option value="annual">Annual Leave</option>
                                <option value="sick">Sick Leave</option>
                            </select>
                        </div>

                        <div className="field-group">
                            <label className="form-label">Leave Duration</label>
                            <select
                                className="input-field"
                                name="half_day"
                                value={form.half_day}
                                onChange={handleChange}
                            >
                                <option value="none">Full Day</option>
                                <option value="AM">AM Half-Day</option>
                                <option value="PM">PM Half-Day</option>
                            </select>
                        </div>

                        <div className="field-group">
                            <label className="form-label">Start Date</label>
                            <input
                                className="input-field"
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="field-group">
                            <label className="form-label">End Date</label>
                            <input
                                className="input-field"
                                type="date"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="field-group full-width">
                        <label className="form-label">Reason</label>
                        <textarea
                            className="input-field input-textarea"
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Optional reason for leave"
                        />
                    </div>

                    <div className="leave-actions">
                        <button type="submit" className="btn btn-primary">Submit</button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate("/dashboard")}
                        >
                            Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ApplyLeavePage;