import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LeaveApprovalPage() {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const fetchPending = async () => {
        try {
            const res = await api.get("/leave/pending");
            setRows(res.data);
        } catch {
            setError("Failed to load pending requests");
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id, status) => {
        setError("");
        setMessage("");

        try {
            const res = await api.put(`/leave/${id}/status`, { status });
            setMessage(res.data.message || `Leave request ${status} successfully.`);
            fetchPending();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update leave request");
        }
    };

    const getTypeLabel = (type) => {
        return type === "annual" ? "Annual Leave" : "Sick Leave";
    };

    const getDurationLabel = (halfDay) => {
        if (halfDay === "none") return "Full Day";
        if (halfDay === "AM") return "AM Leave";
        return "PM Leave";
    };

    return (
        <div className="page-container">
            <div
                className="card-narrow"
                style={{
                    width: "100%",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    padding: "36px 42px"
                }}
            >
                <h1 className="page-title">Leave Approval</h1>

                {message && (
                    <div
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontWeight: 600,
                            marginBottom: "14px",
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
                            marginBottom: "14px",
                            boxSizing: "border-box",
                            background: "rgba(239, 68, 68, 0.18)",
                            border: "1px solid rgba(239, 68, 68, 0.45)",
                            color: "#fecaca"
                        }}
                    >
                        {error}
                    </div>
                )}

                <div
                    style={{
                        overflowX: "auto",
                        borderRadius: "14px",
                        background: "rgba(15, 23, 42, 0.55)",
                        border: "1px solid rgba(255,255,255,0.08)"
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            color: "#f8fafc",
                            minWidth: "1200px"
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "rgba(255,255,255,0.05)"
                                }}
                            >
                                <th style={thStyle}>Employee</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Start</th>
                                <th style={thStyle}>End</th>
                                <th style={thStyle}>Leave Duration</th>
                                <th style={thStyle}>Days</th>
                                <th style={thStyle}>Reason</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        style={{
                                            padding: "22px",
                                            textAlign: "center",
                                            color: "#cbd5e1"
                                        }}
                                    >
                                        No pending leave requests at the moment.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        style={{
                                            borderTop: "1px solid rgba(255,255,255,0.08)",
                                            transition: "background 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600, color: "#f8fafc" }}>
                                                {row.employee_name}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                                                {row.department || "-"}
                                            </div>
                                        </td>

                                        <td style={tdStyle}>{getTypeLabel(row.leave_type)}</td>
                                        <td style={tdStyle}>{row.start_date}</td>
                                        <td style={tdStyle}>{row.end_date}</td>
                                        <td style={tdStyle}>{getDurationLabel(row.half_day)}</td>
                                        <td style={tdStyle}>{row.days_requested}</td>
                                        <td style={tdStyle}>{row.reason || "-"}</td>

                                        <td style={tdStyle}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "10px",
                                                    flexWrap: "wrap"
                                                }}
                                            >
                                                <button
                                                    style={{
                                                        padding: "10px 18px",
                                                        fontWeight: 600,
                                                        background: "rgba(34, 197, 94, 0.2)",
                                                        border: "1px solid rgba(34, 197, 94, 0.5)",
                                                        color: "#bbf7d0",
                                                        borderRadius: "8px",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => handleAction(row.id, "approved")}
                                                >
                                                    Approve
                                                </button>

                                                <button
                                                    style={{
                                                        padding: "10px 18px",
                                                        fontWeight: 600,
                                                        background: "rgba(239, 68, 68, 0.2)",
                                                        border: "1px solid rgba(239, 68, 68, 0.5)",
                                                        color: "#fecaca",
                                                        borderRadius: "8px",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => handleAction(row.id, "rejected")}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "24px"
                    }}
                >
                    <button
                        className="btn btn-secondary"
                        style={{ padding: "10px 22px" }}
                        onClick={() => navigate("/dashboard")}
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}

const thStyle = {
    padding: "18px 22px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 700,
    color: "#f8fafc"
};

const tdStyle = {
    padding: "18px 22px",
    textAlign: "left",
    verticalAlign: "middle",
    fontSize: "14px",
    color: "#e5e7eb"
};

export default LeaveApprovalPage;