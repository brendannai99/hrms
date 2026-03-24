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
            } catch (err) {
                setError("Failed to load leave records");
            }
        };

        fetchData();
    }, []);

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">My Leave History</h1>

                {error && <p className="error-text">{error}</p>}

                {balance && (
                    <div className="info-list">
                        <div>Annual Quota: {balance.annual_quota}</div>
                        <div>Used: {balance.annual_used}</div>
                        <div>Remaining: {balance.annual_remaining}</div>
                    </div>
                )}

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Half Day</th>
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
                                        <td>{row.leave_type}</td>
                                        <td>{row.start_date?.slice(0, 10)}</td>
                                        <td>{row.end_date?.slice(0, 10)}</td>
                                        <td>{row.half_day}</td>
                                        <td>{row.days_requested}</td>
                                        <td>{row.status}</td>
                                        <td>{row.reason || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="dashboard-actions">
                    <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MyLeavePage;