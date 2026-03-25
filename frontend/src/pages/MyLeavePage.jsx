import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function MyLeavePage() {
    const [leaveRows, setLeaveRows] = useState([]);
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const sickLeaveUsed = leaveRows
        .filter((row) => row.leave_type === "sick" && row.status === "approved")
        .reduce((sum, row) => sum + Number(row.days_requested), 0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leaveRes, balanceRes] = await Promise.all([
                    api.get("/leave/my"),
                    api.get("/leave/balance")
                ]);
                setLeaveRows(leaveRes.data);
                setBalance(balanceRes.data);
            } catch {
                setError("Failed to load leave records");
            }
        };

        fetchData();
    }, []);

    const getStatusStyle = (status) => {
        if (status === "approved") {
            return {
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(34, 197, 94, 0.6)",
                color: "#4ade80"
            };
        }

        if (status === "rejected") {
            return {
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.6)",
                color: "#f87171"
            };
        }

        return {
            background: "rgba(245, 158, 11, 0.2)",
            border: "1px solid rgba(245, 158, 11, 0.6)",
            color: "#fbbf24"
        };
    };

    const balanceCardStyle = {
        background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        transition: "all 0.2s ease"
    };

    const handleCardEnter = (e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.5)";
    };

    const handleCardLeave = (e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
    };

    return (
        <div className="page-container">
            <div
                className="card-narrow"
                style={{
                    width: "100%",
                    maxWidth: "980px",
                    margin: "0 auto",
                    padding: "36px 42px"
                }}
            >
                <h1 className="page-title">My Leave History</h1>

                {error && (
                    <div
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            fontSize: "15px",
                            fontWeight: 600,
                            marginBottom: "16px",
                            boxSizing: "border-box",
                            background: "rgba(239, 68, 68, 0.18)",
                            border: "1px solid rgba(239, 68, 68, 0.45)",
                            color: "#fecaca"
                        }}
                    >
                        {error}
                    </div>
                )}

                {balance && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "18px",
                            marginBottom: "28px"
                        }}
                    >
                        <div
                            style={balanceCardStyle}
                            onMouseEnter={handleCardEnter}
                            onMouseLeave={handleCardLeave}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#94a3b8",
                                    marginBottom: "6px"
                                }}
                            >
                                Annual Quota
                            </div>
                            <div
                                style={{
                                    fontSize: "30px",
                                    fontWeight: 800,
                                    letterSpacing: "0.5px",
                                    color: "#f8fafc"
                                }}
                            >
                                {balance.annual_quota}
                            </div>
                        </div>

                        <div
                            style={balanceCardStyle}
                            onMouseEnter={handleCardEnter}
                            onMouseLeave={handleCardLeave}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#94a3b8",
                                    marginBottom: "6px"
                                }}
                            >
                                Annual Used
                            </div>
                            <div
                                style={{
                                    fontSize: "30px",
                                    fontWeight: 800,
                                    letterSpacing: "0.5px",
                                    color: "#f8fafc"
                                }}
                            >
                                {balance.annual_used}
                            </div>
                        </div>

                        <div
                            style={balanceCardStyle}
                            onMouseEnter={handleCardEnter}
                            onMouseLeave={handleCardLeave}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#94a3b8",
                                    marginBottom: "6px"
                                }}
                            >
                                Annual Remaining
                            </div>
                            <div
                                style={{
                                    fontSize: "30px",
                                    fontWeight: 800,
                                    letterSpacing: "0.5px",
                                    color: "#f8fafc"
                                }}
                            >
                                {balance.annual_remaining}
                            </div>
                        </div>
                    </div>
                )}
                <div
                    style={{
                        fontSize: "13px",
                        color: "#94a3b8",
                        marginBottom: "18px",
                        textAlign: "center"
                    }}
                >
                    * Sick leave does not deduct from annual leave balance
                </div>
                <div
                    style={{
                        marginTop: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#cbd5e1",
                        textAlign: "center",
                        marginBottom: "18px"
                    }}
                >
                    Sick Leave Used: <b>{sickLeaveUsed}</b> day(s)
                </div>
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
                            minWidth: "760px"
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "rgba(255,255,255,0.05)"
                                }}
                            >
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Start</th>
                                <th style={thStyle}>End</th>
                                <th style={thStyle}>Leave Duration</th>
                                <th style={thStyle}>Days</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        style={{
                                            padding: "22px",
                                            textAlign: "center",
                                            color: "#cbd5e1"
                                        }}
                                    >
                                        No leave records found.
                                    </td>
                                </tr>
                            ) : (
                                leaveRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        style={{
                                            borderTop: "1px solid rgba(255,255,255,0.08)",
                                            transition: "background 0.2s ease",
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <td style={tdStyle}>
                                            {row.leave_type === "annual" ? "Annual Leave" : "Sick Leave"}
                                        </td>
                                        <td style={tdStyle}>{row.start_date}</td>
                                        <td style={tdStyle}>{row.end_date}</td>
                                        <td style={tdStyle}>
                                            {row.half_day === "none"
                                                ? "Full Day"
                                                : row.half_day === "AM"
                                                    ? "AM Leave"
                                                    : "PM Leave"}
                                        </td>
                                        <td style={tdStyle}>{row.days_requested}</td>
                                        <td style={tdStyle}>
                                            <span
                                                style={{
                                                    ...getStatusStyle(row.status),
                                                    display: "inline-block",
                                                    padding: "6px 12px",
                                                    borderRadius: "999px",
                                                    fontSize: "13px",
                                                    fontWeight: 700
                                                }}
                                            >
                                                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>{row.reason || "-"}</td>
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
                        marginTop: "28px"
                    }}
                >
                    <button
                        className="btn btn-secondary"
                        style={{
                            padding: "10px 22px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                        }}
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
    padding: "16px 18px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 700,
    color: "#f8fafc"
};

const tdStyle = {
    padding: "16px 18px",
    textAlign: "left",
    verticalAlign: "top",
    fontSize: "14px",
    color: "#e5e7eb"
};

export default MyLeavePage;