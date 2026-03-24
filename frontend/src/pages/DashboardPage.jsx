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

                if (res.data.must_change_password) {
                    navigate("/first-time-password");
                    return;
                }

                setUser(res.data);
            } catch {
                setError("Failed to load user");
                localStorage.removeItem("token");
                navigate("/");
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            await api.post("/auth/logout", { refreshToken });
        } catch {
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            navigate("/");
        }
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
                    <div>Department: {user.department || "-"}</div>
                </div>

                <div className="dashboard-actions">
                    <button className="btn btn-primary" onClick={() => navigate("/profile")}>
                        My Profile
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate("/change-password")}>
                        Change Password
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate("/my-salary")}>
                        My Salary
                    </button>

                    <button className="btn btn-primary" onClick={() => navigate("/apply-leave")}>
                        Apply Leave
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate("/my-leave")}>
                        My Leave History
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate("/public-holidays")}>
                        Public Holidays
                    </button>

                    {(user.role === "manager" || user.role === "admin") && (
                        <button className="btn btn-primary" onClick={() => navigate("/leave-approval")}>
                            Leave Approval
                        </button>
                    )}

                    {user.role === "admin" && (
                        <>
                            <button className="btn btn-primary" onClick={() => navigate("/create-employee")}>
                                Create Employee
                            </button>
                            <button className="btn btn-primary" onClick={() => navigate("/employees")}>
                                Manage Employees
                            </button>
                            <button className="btn btn-primary" onClick={() => navigate("/salary-management")}>
                                Salary Management
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