import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function MyLeavePage() {
    const [leaveRows, setLeaveRows] = useState([]);
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

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

    const getStatusClass = (status) => {
        if (status === "approved") return "status-badge status-approved";
        if (status === "rejected") return "status-badge status-rejected";
        return "status-badge status-pending";
    };

    return (
        <div className="page-container leave-page">
            <div className="card-narrow leave-card">
                <h1 className="page-title">My Leave History</h1>

                {error && <p className="message-error">{error}</p>}

                {balance && (
                    <div className="balance-box">
                        <div className="balance-item">
                            <div className="balance-label">Annual Quota</div>
                            <div className="balance-value">{balance.annual_quota}</div>
                        </div>
                        <div className="balance-item">
                            <div className="balance-label">Used</div>
                            <div className="balance-value">{balance.annual_used}</div>
                        </div>
                        <div className="balance-item">
                            <div className="balance-label">Remaining</div>
                            <div className="balance-value">{balance.annual_remaining}</div>
                        </div>
                    </div>
                )}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Leave Duration</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRows.length === 0 ? (
                                <tr>
                                    <td colSpan="7">No leave records found.</td>
                                </tr>
                            ) : (
                                leaveRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.leave_type === "annual" ? "Annual Leave" : "Sick Leave"}</td>
                                        <td>{row.start_date}</td>
                                        <td>{row.end_date}</td>

                                        <td>
                                            {row.half_day === "none"
                                                ? "Full Day"
                                                : row.half_day === "AM"
                                                    ? "AM Leave"
                                                    : "PM Leave"}
                                        </td>

                                        <td>{row.days_requested}</td>
                                        <td>
                                            <span
                                                className={
                                                    row.status === "approved"
                                                        ? "status-badge status-approved"
                                                        : row.status === "rejected"
                                                            ? "status-badge status-rejected"
                                                            : "status-badge status-pending"
                                                }
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>{row.reason || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="leave-actions">
                    <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MyLeavePage;