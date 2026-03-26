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
                setError("Failed to load user information");
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
            // Silence logout errors
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            navigate("/");
        }
    };

    if (error) return <p style={{ color: "white", textAlign: "center", marginTop: "50px" }}>{error}</p>;
    if (!user) return <p className="center-text">Initialising System...</p>;

    // --- PREMIUM THEME & ANIMATION STYLES ---
    const layoutStyle = {
        display: "flex",
        height: "100vh",
        background: "radial-gradient(circle at 50% 50%, #1e293b 0%, #080c14 100%)",
        color: "#f8fafc",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif"
    };

    const sidebarStyle = {
        width: "300px",
        background: "rgba(10, 15, 25, 0.8)",
        backdropFilter: "blur(25px)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: "40px 28px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
    };

    const mainContentStyle = {
        flex: 1,
        padding: "40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: "28px",
        maxWidth: "1300px"
    };

    const cardStyle = {
    background: "rgba(30, 41, 59, 0.3)",
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "36px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    transition: "all 0.3s ease-out", 
    cursor: "default"
};

    const buttonStyle = {
        padding: "14px 22px",
        background: "rgba(59, 130, 246, 0.1)",
        color: "#60a5fa",
        borderRadius: "14px",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease-in-out"
    };

    const badgeStyle = {
        padding: "6px 12px",
        background: "rgba(255, 255, 255, 0.05)",
        color: "#94a3b8",
        borderRadius: "10px",
        fontSize: "12px",
        fontWeight: 600,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "inline-block",
        marginTop: "10px"
    };

    const renderActionCard = (category, title, buttons) => (
    <section 
        style={cardStyle}
        onMouseEnter={(e) => {
            // REDUCED: Minimal lift, no scale, and a softer shadow
            e.currentTarget.style.transform = "translateY(-4px)"; 
            e.currentTarget.style.background = "rgba(30, 41, 59, 0.45)";
            e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
            e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.background = "rgba(30, 41, 59, 0.3)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            e.currentTarget.style.boxShadow = "none";
        }}
        >
            <div>
                <div style={{ fontSize: "12px", color: "#60a5fa", fontWeight: 800, letterSpacing: "1.5px", marginBottom: "8px" }}>
                    {category.toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>{title}</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {buttons.map((btn, index) => (
                    <button 
                        key={index}
                        style={buttonStyle} 
                        onClick={() => navigate(btn.path)}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#3b82f6";
                            e.target.style.color = "white";
                            e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "rgba(59, 130, 246, 0.1)";
                            e.target.style.color = "#60a5fa";
                            e.target.style.transform = "scale(1)";
                        }}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </section>
    );

    return (
        <div style={layoutStyle}>
            {/* --- SIDEBAR --- */}
            <aside style={sidebarStyle}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "50px", letterSpacing: "-1.5px" }}>
                        HRMS<span style={{ color: "#3b82f6" }}>.</span>
                    </h1>
                    
                    <div style={{ marginBottom: "40px" }}>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>{user.email}</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                           <span style={{ ...badgeStyle, color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                               {user.role === 'admin' ? 'System Administrator' : user.role === 'manager' ? 'Department Manager' : 'Employee'}
                           </span>
                           <span style={badgeStyle}>{user.department || "General Operations"}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    onMouseEnter={(e) => e.target.style.background = "#ef4444"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                    style={{ 
                        padding: "14px", 
                        background: "transparent", 
                        color: "#ef4444", 
                        borderRadius: "14px", 
                        border: "1px solid #ef4444", 
                        fontWeight: 700, 
                        cursor: "pointer", 
                        transition: "0.2s" 
                    }}
                >
                    Logout
                </button>
            </aside>

            {/* --- MAIN MODULE GRID --- */}
            <main style={mainContentStyle}>
                
                {renderActionCard("Personnel", "Account Management", [
                    { label: "My Profile", path: "/profile" },
                    { label: "Security Settings", path: "/change-password" },
                    ...(user.role === "admin" ? [
                        { label: "Onboard New Employee", path: "/create-employee" },
                        { label: "Employee Directory", path: "/employees" }
                    ] : [])
                ])}

                {renderActionCard("Scheduling", "Time and Attendance", [
                    { label: "Apply for Leave", path: "/apply-leave" },
                    { label: "Leave History", path: "/my-leave" },
                    { label: "Public Holidays", path: "/public-holidays" },
                    ...((user.role === "manager" || user.role === "admin") ? [
                        { label: "Leave Approvals", path: "/leave-approval" }
                    ] : [])
                ])}

                {renderActionCard("Structure", "Organisational Structure", [
                    { label: "Organisational Chart", path: "/org-chart" },
                    { label: "Performance Reviews", path: "/performance" },
                    ...(user.role === "manager" ? [{ label: "Team Management", path: "/my-team" }] : [])
                ])}

                {renderActionCard("Finance", "Payroll and Salary", [
                    { label: "My Salary", path: "/my-salary" },
                    ...(user.role === "admin" ? [{ label: "Salary Management", path: "/salary-management" }] : [])
                ])}

            </main>
        </div>
    );
}

export default DashboardPage;