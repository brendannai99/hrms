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

    const labelStyle = {
        display: "block",
        fontSize: "15px",
        fontWeight: 600,
        color: "#f8fafc",
        marginBottom: "8px"
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(15, 23, 42, 0.88)",
        color: "#f8fafc",
        fontSize: "15px",
        boxSizing: "border-box",
        outline: "none"
    };

    const textAreaStyle = {
        ...inputStyle,
        minHeight: "130px",
        resize: "vertical"
    };

    return (
        <div className="page-container">
            <div
                className="card-narrow"
                style={{
                    width: "100%",
                    maxWidth: "780px",
                    margin: "0 auto",
                    padding: "36px 42px"
                }}
            >
                <h1 className="page-title">Apply Leave</h1>

                {message && (
                    <div
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontWeight: 600,
                            marginBottom: "10px",
                            boxSizing: "border-box",
                            background: "rgba(34, 197, 94, 0.18)",
                            border: "1px solid rgba(34, 197, 94, 0.45)",
                            color: "#bbf7d0"
                        }}
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontWeight: 600,
                            marginBottom: "10px",
                            boxSizing: "border-box",
                            background: "rgba(239, 68, 68, 0.18)",
                            border: "1px solid rgba(239, 68, 68, 0.45)",
                            color: "#fecaca"
                        }}
                    >
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "22px",
                        width: "100%"
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px 24px",
                            width: "100%"
                        }}
                    >
                        <div>
                            <label style={labelStyle}>Leave Type</label>
                            <select
                                style={inputStyle}
                                name="leave_type"
                                value={form.leave_type}
                                onChange={handleChange}
                            >
                                <option value="annual">Annual Leave</option>
                                <option value="sick">Sick Leave</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Leave Duration</label>
                            <select
                                style={inputStyle}
                                name="half_day"
                                value={form.half_day}
                                onChange={handleChange}
                            >
                                <option value="none">Full Day</option>
                                <option value="AM">AM Leave</option>
                                <option value="PM">PM Leave</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Start Date</label>
                            <input
                                style={inputStyle}
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>End Date</label>
                            <input
                                style={inputStyle}
                                type="date"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Reason</label>
                            <textarea
                                style={textAreaStyle}
                                name="reason"
                                value={form.reason}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Optional reason for leave"
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "16px",
                            marginTop: "12px"
                        }}
                    >
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ padding: "10px 20px" }}
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: "10px 20px" }}
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