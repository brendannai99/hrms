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

        {error && <p>{error}</p>}

        <div className="table-wrapper">
          <table>
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
                  <td colSpan="8">No pending leave requests.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.employee_name}</td>
                    <td>{row.leave_type}</td>
                    <td>{row.start_date?.slice(0, 10)}</td>
                    <td>{row.end_date?.slice(0, 10)}</td>
                    <td>{row.half_day}</td>
                    <td>{row.days_requested}</td>
                    <td>{row.reason || "-"}</td>
                    <td>
                      <button onClick={() => handleAction(row.id, "approved")}>
                        Approve
                      </button>
                      <button onClick={() => handleAction(row.id, "rejected")}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button onClick={() => navigate("/dashboard")}>Back</button>
      </div>
    </div>
  );
}

export default LeaveApprovalPage;