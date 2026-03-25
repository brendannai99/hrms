import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function PublicHolidaysPage() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({ holiday_date: "", name: "" });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ holiday_date: "", name: "" });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [holidayRes, userRes] = await Promise.all([
                    api.get("/leave/holidays"),
                    api.get("/auth/me")
                ]);
                setRows(holidayRes.data);
                setUser(userRes.data);
            } catch {
                setError("Failed to load holidays");
            }
        };

        fetchData();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await api.get("/leave/holidays");
            setRows(res.data);
        } catch {
            setError("Failed to load holidays");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await api.post("/leave/holidays", form);
            setMessage(res.data.message || "Public holiday added successfully.");
            setForm({ holiday_date: "", name: "" });
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to add holiday");
        }
    };

    const handleDelete = async (id) => {
        setError("");
        setMessage("");

        try {
            const res = await api.delete(`/leave/holidays/${id}`);
            setMessage(res.data.message || "Public holiday deleted successfully.");
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete holiday");
        }
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        setEditForm({
            holiday_date: row.holiday_date,
            name: row.name
        });
        setError("");
        setMessage("");
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({ holiday_date: "", name: "" });
    };

    const handleSave = async (id) => {
        setError("");
        setMessage("");

        try {
            const res = await api.put(`/leave/holidays/${id}`, editForm);
            setMessage(res.data.message || "Public holiday updated successfully.");
            setEditingId(null);
            setEditForm({ holiday_date: "", name: "" });
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update holiday");
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
                <h1 className="page-title">Company Public Holidays</h1>

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

                {user?.role === "admin" && (
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px 24px",
                            marginBottom: "28px"
                        }}
                    >
                        <div>
                            <label style={labelStyle}>Holiday Date</label>
                            <input
                                style={inputStyle}
                                type="date"
                                value={form.holiday_date}
                                onChange={(e) =>
                                    setForm({ ...form, holiday_date: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Holiday Name</label>
                            <input
                                style={inputStyle}
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="Enter holiday name"
                                required
                            />
                        </div>

                        <div
                            style={{
                                gridColumn: "1 / -1",
                                display: "flex",
                                justifyContent: "center",
                                marginTop: "4px"
                            }}
                        >
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ padding: "10px 22px" }}
                            >
                                Add Holiday
                            </button>
                        </div>
                    </form>
                )}

                <div
                    style={{
                        marginTop: "12px",
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
                            minWidth: user?.role === "admin" ? "700px" : "560px"
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "rgba(255,255,255,0.05)"
                                }}
                            >
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Name</th>
                                {user?.role === "admin" && <th style={thStyle}>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={user?.role === "admin" ? 3 : 2}
                                        style={{
                                            padding: "22px",
                                            textAlign: "center",
                                            color: "#cbd5e1"
                                        }}
                                    >
                                        No holidays configured.
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
                                        {editingId === row.id ? (
                                            <>
                                                <td style={tdStyle}>
                                                    <input
                                                        type="date"
                                                        value={editForm.holiday_date}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                holiday_date: e.target.value
                                                            })
                                                        }
                                                        style={inputStyle}
                                                    />
                                                </td>

                                                <td style={tdStyle}>
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                name: e.target.value
                                                            })
                                                        }
                                                        style={inputStyle}
                                                    />
                                                </td>

                                                <td style={tdStyle}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        style={{ marginRight: "8px", padding: "8px 16px" }}
                                                        onClick={() => handleSave(row.id)}
                                                    >
                                                        Save
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ padding: "8px 16px" }}
                                                        onClick={handleCancel}
                                                    >
                                                        Cancel
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={tdStyle}>{row.holiday_date}</td>
                                                <td style={tdStyle}>{row.name}</td>

                                                {user?.role === "admin" && (
                                                    <td style={tdStyle}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            style={{ marginRight: "8px", padding: "8px 16px" }}
                                                            onClick={() => handleEdit(row)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            style={{ padding: "8px 16px" }}
                                                            onClick={() => handleDelete(row.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                )}
                                            </>
                                        )}
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
    padding: "16px 18px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 700,
    color: "#f8fafc"
};

const tdStyle = {
    padding: "16px 18px",
    textAlign: "left",
    verticalAlign: "middle",
    fontSize: "14px",
    color: "#e5e7eb"
};

export default PublicHolidaysPage;