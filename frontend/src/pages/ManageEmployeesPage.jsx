import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ManageEmployeesPage() {
  const [employees, setEmployees] = useState([]);
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
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch employees");
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

        fetchEmployees();
      } catch {
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    checkUser();
  }, [navigate]);

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
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update employee");
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
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
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
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEditClick(employee)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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