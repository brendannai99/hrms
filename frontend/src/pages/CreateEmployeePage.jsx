import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateEmployeePage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await api.get("/auth/me");
                setCurrentUser(res.data);

                if (res.data.role !== "admin") {
                    navigate("/dashboard");
                }
            } catch {
                localStorage.removeItem("token");
                navigate("/");
            }
        };

        checkUser();
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
            const res = await api.post("/employees", form);
            setMessage(res.data.message);
            setForm({
                name: "",
                email: "",
                password: "",
                role: "employee",
                department: ""
            });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create employee");
        }
    };

    if (!currentUser) {
        return <p className="center-text">Loading...</p>;
    }

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Create Employee</h1>

                {message && <div className="message">{message}</div>}
                {error && <div className="error">{error}</div>}

                <form className="form-layout" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input className="form-input" name="name" value={form.name} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input className="form-input" name="password" type="password" value={form.password} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                            <option value="employee">employee</option>
                            <option value="manager">manager</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <input className="form-input" name="department" value={form.department} onChange={handleChange} />
                    </div>

                    <div className="button-row-center">
                        <button className="btn btn-primary" type="submit">
                            Create
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

export default CreateEmployeePage;