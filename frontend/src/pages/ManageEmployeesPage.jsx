import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TablePagination } from "@mui/material";
import api from "../services/api";

function formatDetails(details) {
  if (!details) return "-";

  try {
    const parsed = typeof details === "string" ? JSON.parse(details) : details;

    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  } catch {
    return details;
  }
}

function ManageEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "employee",
    department: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [auditFilters, setAuditFilters] = useState({
    page: 0,
    rowsPerPage: 10
  });

  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setEmployees([]);
      setError(err.response?.data?.error || "Failed to fetch employees");
    }
  };

  const fetchAuditLogs = async (page = auditFilters.page, rowsPerPage = auditFilters.rowsPerPage) => {
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage)
      });

      const res = await api.get(`/salary/audit-logs?${params.toString()}`);
      console.log("audit logs response:", res.data);

      const logs = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.auditLogs)
          ? res.data.auditLogs
          : Array.isArray(res.data.data)
            ? res.data.data
            : [];

      setAuditLogs(logs);

      if (res.data.pagination) {
        setAuditPagination(res.data.pagination);
      } else {
        setAuditPagination({
          page: page + 1,
          limit: rowsPerPage,
          total: logs.length,
          totalPages: 1
        });
      }
    } catch (err) {
      setAuditLogs([]);
      setAuditPagination({
        page: 1,
        limit: rowsPerPage,
        total: 0,
        totalPages: 0
      });
      setError(err.response?.data?.error || "Failed to fetch audit logs");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data);

        if (res.data.role !== "admin") {
          navigate("/dashboard");
          return;
        }

        await Promise.all([
          fetchEmployees(),
          fetchAuditLogs(auditFilters.page, auditFilters.rowsPerPage)
        ]);
      } catch {
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;
    fetchAuditLogs(auditFilters.page, auditFilters.rowsPerPage);
  }, [auditFilters.page, auditFilters.rowsPerPage, currentUser]);

  const handleEditClick = (employee) => {
    setEditingEmployeeId(employee.id);
    setEditForm({
      name: employee.name || "",
      email: employee.email || "",
      role: employee.role || "employee",
      department: employee.department || ""
    });
    setMessage("");
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingEmployeeId(null);
    setEditForm({
      name: "",
      email: "",
      role: "employee",
      department: ""
    });
  };

  const handleChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (id) => {
    setMessage("");
    setError("");

    try {
      const res = await api.put(`/employees/${id}`, editForm);
      setMessage(res.data.message);
      setEditingEmployeeId(null);
      await Promise.all([
        fetchEmployees(),
        fetchAuditLogs(auditFilters.page, auditFilters.rowsPerPage)
      ]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update employee");
    }
  };

  const handleUnlock = async (id) => {
    setMessage("");
    setError("");

    try {
      const res = await api.put(`/employees/${id}/unlock`);
      setMessage(res.data.message);
      await Promise.all([
        fetchEmployees(),
        fetchAuditLogs(auditFilters.page, auditFilters.rowsPerPage)
      ]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to unlock employee account");
    }
  };

  if (!currentUser) {
    return <p className="center-text">Loading...</p>;
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1 className="page-title">Manage Employees</h1>

        {message && <div className="message">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Failed Attempts</th>
                <th>Locked Until</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="center-text">No employees found.</td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const isLocked =
                    employee.locked_until && new Date(employee.locked_until) > new Date();

                  return (
                    <tr key={employee.id}>
                      <td>
                        {editingEmployeeId === employee.id ? (
                          <input
                            className="form-input"
                            name="name"
                            value={editForm.name}
                            onChange={handleChange}
                          />
                        ) : (
                          employee.name
                        )}
                      </td>

                      <td>
                        {editingEmployeeId === employee.id ? (
                          <input
                            className="form-input"
                            name="email"
                            value={editForm.email}
                            onChange={handleChange}
                          />
                        ) : (
                          employee.email
                        )}
                      </td>

                      <td>
                        {editingEmployeeId === employee.id ? (
                          <select
                            className="form-select"
                            name="role"
                            value={editForm.role}
                            onChange={handleChange}
                          >
                            <option value="employee">employee</option>
                            <option value="manager">manager</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          employee.role
                        )}
                      </td>

                      <td>
                        {editingEmployeeId === employee.id ? (
                          <input
                            className="form-input"
                            name="department"
                            value={editForm.department}
                            onChange={handleChange}
                          />
                        ) : (
                          employee.department
                        )}
                      </td>

                      <td>{employee.failed_login_attempts || 0}</td>
                      <td>{employee.locked_until || "-"}</td>

                      <td>
                        {editingEmployeeId === employee.id ? (
                          <div className="button-row">
                            <button
                              className="btn btn-success"
                              onClick={() => handleSave(employee.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="button-row">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleEditClick(employee)}
                            >
                              Edit
                            </button>

                            {isLocked && (
                              <button
                                className="btn btn-warning"
                                onClick={() => handleUnlock(employee.id)}
                              >
                                Unlock
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <h2 className="page-title" style={{ marginTop: "32px", fontSize: "2rem" }}>
          Audit Trail
        </h2>

        <div className="table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target Type</th>
                <th>Target ID</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {!Array.isArray(auditLogs) || auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="center-text">No audit records yet.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.created_at}</td>
                    <td>{log.actor_name || "System"}</td>
                    <td>{log.action}</td>
                    <td>{log.target_type}</td>
                    <td>{log.target_id || "-"}</td>
                    <td>{formatDetails(log.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <TablePagination
            component="div"
            count={auditPagination.total}
            page={auditFilters.page}
            onPageChange={(_, nextPage) =>
              setAuditFilters((prev) => ({ ...prev, page: nextPage }))
            }
            rowsPerPage={auditFilters.rowsPerPage}
            onRowsPerPageChange={(e) =>
              setAuditFilters((prev) => ({
                ...prev,
                rowsPerPage: Number(e.target.value),
                page: 0
              }))
            }
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              color: "#fff",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              ".MuiTablePagination-selectLabel": {
                color: "#fff"
              },
              ".MuiTablePagination-displayedRows": {
                color: "#fff"
              },
              ".MuiSelect-select": {
                color: "#fff"
              },
              ".MuiSvgIcon-root": {
                color: "#fff"
              },
              ".MuiIconButton-root": {
                color: "#fff"
              },
              ".MuiIconButton-root.Mui-disabled": {
                color: "rgba(255,255,255,0.35)"
              }
            }}
          />
        </div>

        <div className="top-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManageEmployeesPage;