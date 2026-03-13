import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProfilePage() {
    const [form, setForm] = useState({
        id: "",
        name: "",
        email: "",
        role: "",
        department: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get("/auth/me");
                setForm({
                    id: res.data.id || "",
                    name: res.data.name || "",
                    email: res.data.email || "",
                    role: res.data.role || "",
                    department: res.data.department || ""
                });
            } catch {
                localStorage.removeItem("token");
                navigate("/");
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const res = await api.put("/auth/profile", {
                name: form.name
            });

            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update profile");
        }
    };

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">My Profile</h1>

                {message && <div className="message">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form className="form-layout" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            className="form-input"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Work Email</label>
                        <input className="form-input" name="email" value={form.email} readOnly />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <input className="form-input" name="role" value={form.role} readOnly />
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <input className="form-input" name="department" value={form.department} readOnly />
                    </div>

                    <div className="button-row-center">
                        <button className="btn btn-primary" type="submit">
                            Update Profile
                        </button>
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => navigate("/dashboard")}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfilePage;