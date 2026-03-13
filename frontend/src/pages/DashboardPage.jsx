import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function DashboardPage() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/auth/me");
                setUser(res.data);
            } catch (err) {
                setError("Failed to load user");
                localStorage.removeItem("token");
                navigate("/");
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    if (error) {
        return <p>{error}</p>;
    }

    if (!user) {
        return <p className="center-text">Loading...</p>;
    }

    return (
        <div className="page-container">
            <div className="card-narrow">
                <h1 className="page-title">Dashboard</h1>

                <div className="info-list">
                    <div>Welcome, {user.name}</div>
                    <div>Email: {user.email}</div>
                    <div>Role: {user.role}</div>
                    <div>Department: {user.department}</div>
                </div>

                <div className="button-row-center">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/profile")}
                    >
                        My Profile
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/change-password")}
                    >
                        Change Password
                    </button>

                    {user.role === "admin" && (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/create-employee")}
                            >
                                Create Employee
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/employees")}
                            >
                                Manage Employees
                            </button>
                        </>
                    )}

                    <button className="btn btn-secondary" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;