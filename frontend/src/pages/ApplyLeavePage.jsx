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
    <div className="page-container">
      <div className="card-narrow">
        <h1 className="page-title">Apply Leave</h1>

        {message && <p>{message}</p>}
        {error && <p>{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Leave Type</label>
          <select name="leave_type" value={form.leave_type} onChange={handleChange}>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
          </select>

          <label>Start Date</label>
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />

          <label>End Date</label>
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />

          <label>Half Day</label>
          <select name="half_day" value={form.half_day} onChange={handleChange}>
            <option value="none">Full Day</option>
            <option value="AM">AM Half-Day</option>
            <option value="PM">PM Half-Day</option>
          </select>

          <label>Reason</label>
          <textarea name="reason" value={form.reason} onChange={handleChange} />

          <button type="submit">Submit</button>
          <button type="button" onClick={() => navigate("/dashboard")}>Back</button>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeavePage;