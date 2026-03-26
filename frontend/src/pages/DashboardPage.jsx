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

    const sectionTitleStyle = {
        fontSize: "18px",
        fontWeight: 800,
        color: "#f8fafc",
        marginBottom: "14px",
        letterSpacing: "0.5px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    };

    const sectionCardStyle = {
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
    };

    const sectionButtonGridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px"
    };

    const actionButtonStyle = {
        width: "100%",
        padding: "12px 14px",
        fontWeight: 600,
        transition: "all 0.2s ease"
    };

    const statCardStyle = {
        background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
    };

    const renderActionButton = (label, path) => (
        <button
            className="btn btn-primary"
            style={actionButtonStyle}
            onClick={() => navigate(path)}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {label}
        </button>
    );

    return (
        <div className="page-container">
            <div
                className="card-narrow"
                style={{
                    width: "100%",
                    maxWidth: "1080px",
                    margin: "0 auto",
                    padding: "36px 42px"
                }}
            >
                <h1 className="page-title">Dashboard</h1>

                <div
                    style={{
                        background: "rgba(15, 23, 42, 0.45)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        padding: "20px",
                        marginBottom: "24px",
                        color: "#f8fafc",
                        lineHeight: "1.8",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.28)"
                    }}
                >
                    <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "6px" }}>
                        Welcome, {user.name}
                    </div>
                    <div>Email: {user.email}</div>
                    <div style={{ textTransform: "capitalize" }}>Role: {user.role}</div>
                    <div>Department: {user.department || "-"}</div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px",
                        marginBottom: "24px"
                    }}
                >
                    <div style={statCardStyle}>
                        <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                            Current Role
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", textTransform: "capitalize" }}>
                            {user.role}
                        </div>
                    </div>

                    <div style={statCardStyle}>
                        <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                            Department
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc" }}>
                            {user.department || "-"}
                        </div>
                    </div>

                    <div style={statCardStyle}>
                        <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
                            Access Level
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc" }}>
                            {user.role === "admin"
                                ? "Full"
                                : user.role === "manager"
                                    ? "Manager"
                                    : "Employee"}
                        </div>
                    </div>
                </div>

                <div style={sectionCardStyle}>
                    <div style={sectionTitleStyle}>
                        <span>👤</span>
                        <span>Account & User Management</span>
                    </div>
                    <div style={sectionButtonGridStyle}>
                        {renderActionButton("My Profile", "/profile")}
                        {renderActionButton("Change Password", "/change-password")}

                        {user.role === "admin" && (
                            <>
                                {renderActionButton("Create Employee", "/create-employee")}
                                {renderActionButton("Manage Employees", "/employees")}
                            </>
                        )}
                    </div>
                </div>

                <div style={sectionCardStyle}>
                    <div style={sectionTitleStyle}>
                        <span>🗓️</span>
                        <span>Leave Management</span>
                    </div>
                    <div style={sectionButtonGridStyle}>
                        {renderActionButton("Apply Leave", "/apply-leave")}
                        {renderActionButton("My Leave History", "/my-leave")}
                        {renderActionButton("Public Holidays", "/public-holidays")}

                        {(user.role === "manager" || user.role === "admin") &&
                            renderActionButton("Leave Approval", "/leave-approval")}
                    </div>
                </div>

                <div style={sectionCardStyle}>
                    <div style={sectionTitleStyle}>
                        <span>🏢</span>
                        <span>Organization & Performance</span>
                    </div>
                    <div style={sectionButtonGridStyle}>
                        {renderActionButton("View Org Chart", "/org-chart")}
                        {renderActionButton("Performance Reviews", "/performance")}

                        {user.role === "manager" &&
                            renderActionButton("My Team", "/my-team")}
                    </div>
                </div>

                <div style={sectionCardStyle}>
                    <div style={sectionTitleStyle}>
                        <span>💰</span>
                        <span>Salary Management</span>
                    </div>
                    <div style={sectionButtonGridStyle}>
                        {renderActionButton("My Salary", "/my-salary")}

                        {user.role === "admin" &&
                            renderActionButton("Salary Management", "/salary-management")}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "28px"
                    }}
                >
                    <button
                        className="btn btn-secondary"
                        style={{
                            padding: "12px 24px",
                            fontWeight: 600
                        }}
                        onClick={handleLogout}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.35)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;