import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function PublicHolidaysPage() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({ holiday_date: "", name: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchHolidays = async () => {
        try {
            const res = await api.get("/leave/holidays");
            setRows(res.data);
        } catch {
            setError("Failed to load holidays");
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/leave/holidays", form);
            setForm({ holiday_date: "", name: "" });
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add holiday");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/leave/holidays/${id}`);
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete holiday");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Public Holidays</h1>

                {error && <p className="message-error">{error}</p>}

                <form onSubmit={handleSubmit} className="form-stack">
                    <label className="form-label">Holiday Date</label>
                    <input
                        className="input-field"
                        type="date"
                        value={form.holiday_date}
                        onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
                        required
                    />

                    <label className="form-label">Holiday Name</label>
                    <input
                        className="input-field"
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />

                    <button type="submit" className="btn btn-primary">Add Holiday</button>
                </form>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="3">No holidays configured.</td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.holiday_date?.slice(0, 10)}</td>
                                        <td>{row.name}</td>
                                        <td>
                                            <button className="btn btn-secondary" onClick={() => handleDelete(row.id)}>
                                                Delete
                                            </button>
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

export default PublicHolidaysPage;