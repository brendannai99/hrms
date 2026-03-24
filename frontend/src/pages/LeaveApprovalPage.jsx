import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LeaveApprovalPage() {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchPending = async () => {
        try {
            const res = await api.get("/leave/pending");
            setRows(res.data);
        } catch (err) {
            setError("Failed to load pending requests");
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id, status) => {
        try {
            await api.put(`/leave/${id}/status`, { status });
            fetchPending();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update leave request");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Leave Approval</h1>

                {error && <p className="message-error">{error}</p>}

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Half Day</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="8">No pending leave requests at the moment.</td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.employee_name}</td>
                                        <td>{row.leave_type === "annual" ? "Annual Leave" : "Sick Leave"}</td>
                                        <td>{row.start_date?.slice(0, 10)}</td>
                                        <td>{row.end_date?.slice(0, 10)}</td>
                                        <td>{row.half_day}</td>
                                        <td>{row.days_requested}</td>
                                        <td>{row.reason || "-"}</td>
                                        <td>
                                            <div className="dashboard-actions">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleAction(row.id, "approved")}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
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

                <div className="dashboard-actions">
                    <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LeaveApprovalPage;