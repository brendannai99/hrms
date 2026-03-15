import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/SalaryManagement.css";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

function currency(value) {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

const employeeMenuProps = {
  PaperProps: {
    className: "salary-management-menu-paper",
  },
};

function SalaryManagementPage() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [salaryForm, setSalaryForm] = useState({
    employee_id: "",
    base_salary: "",
    effective_date: todayValue(),
  });
  const [issueForm, setIssueForm] = useState({
    employee_id: "",
    payroll_month: currentMonthValue(),
    deduction_amount: "0",
    remarks: "",
  });
  const [bulkMonth, setBulkMonth] = useState(currentMonthValue());

  const navigate = useNavigate();

  const loadPage = async () => {
    try {
      const [meRes, salaryRes, payrollRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/salary/salary-records"),
        api.get("/salary/payroll-records"),
      ]);

      if (meRes.data.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setUser(meRes.data);
      setEmployees(salaryRes.data);
      setPayrolls(payrollRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load salary management page");
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const totals = useMemo(
    () => ({
      employeesWithSalary: employees.filter((item) => item.salary_record_id).length,
      payrollsIssued: payrolls.filter((item) => item.status === "issued").length,
      corrections: payrolls.filter((item) => item.status === "correction").length,
    }),
    [employees, payrolls]
  );

  const onSalaryChange = (e) =>
    setSalaryForm({ ...salaryForm, [e.target.name]: e.target.value });

  const onIssueChange = (e) =>
    setIssueForm({ ...issueForm, [e.target.name]: e.target.value });

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/salary/salary-records", {
        employee_id: Number(salaryForm.employee_id),
        base_salary: Number(salaryForm.base_salary),
        effective_date: salaryForm.effective_date,
      });

      setMessage(res.data.message);
      setSalaryForm({
        employee_id: "",
        base_salary: "",
        effective_date: todayValue(),
      });

      await loadPage();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update salary");
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/salary/payroll-records/issue", {
        employee_id: Number(issueForm.employee_id),
        payroll_month: issueForm.payroll_month,
        deduction_amount: Number(issueForm.deduction_amount || 0),
        remarks: issueForm.remarks,
      });

      setMessage(res.data.message);
      setIssueForm({
        employee_id: "",
        payroll_month: currentMonthValue(),
        deduction_amount: "0",
        remarks: "",
      });

      await loadPage();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to issue payroll");
    }
  };

  const handleBulkIssue = async () => {
    setMessage("");
    setError("");

    try {
      const res = await api.post("/salary/payroll-records/issue-bulk", {
        payroll_month: bulkMonth,
      });

      setMessage(
        `${res.data.message}. Issued: ${res.data.issued_count}, Skipped: ${res.data.skipped_count}`
      );

      await loadPage();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to run bulk payroll");
    }
  };

  if (!user) {
    return (
      <Box className="salary-management-page" sx={{ minHeight: "100vh", backgroundColor: "#2b3145", display: "grid", placeItems: "center", py: 3 }}>
        <Typography className="salary-management-loading">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box className="salary-management-page" sx={{ minHeight: "100vh", backgroundColor: "#2b3145", py: 3 }}>
      <Container maxWidth="xl" className="salary-management-container" sx={{ py: 0 }}>
        <Paper className="salary-management-panel" sx={{ p: { xs: 2, md: 3 }, backgroundColor: "#2b3145", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
          <Stack spacing={3}>
            <Typography variant="h3" fontWeight={800} className="salary-management-title">
              Salary Management & Monthly Payroll
            </Typography>

            {message && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {message}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Paper className="salary-management-card" sx={{ p: 2, backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
                  <Typography className="salary-management-muted-text" variant="body2">
                    Employees With Salary
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="salary-management-card-value" sx={{ mt: 0.5 }}>
                    {totals.employeesWithSalary}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="salary-management-card" sx={{ p: 2, backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
                  <Typography className="salary-management-muted-text" variant="body2">
                    Payroll Issued Rows
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="salary-management-card-value" sx={{ mt: 0.5 }}>
                    {totals.payrollsIssued}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="salary-management-card" sx={{ p: 2, backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
                  <Typography className="salary-management-muted-text" variant="body2">
                    Correction Rows
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="salary-management-card-value" sx={{ mt: 0.5 }}>
                    {totals.corrections}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider className="salary-management-divider" />

            <Box>
              <Typography variant="h5" fontWeight={800} className="salary-management-section-title" sx={{ mb: 2 }}>
                Admin-Only Salary Update
              </Typography>

              <Box component="form" onSubmit={handleSalarySubmit}>
                <Box className="salary-management-form-grid salary-management-salary-grid">
                  <FormControl fullWidth required className="salary-management-input salary-management-select salary-management-salary-select">
                    <InputLabel id="salary-employee-label">Employee</InputLabel>
                    <Select
                      labelId="salary-employee-label"
                      label="Employee"
                      name="employee_id"
                      value={salaryForm.employee_id}
                      onChange={onSalaryChange}
                      MenuProps={employeeMenuProps}
                      renderValue={(selected) => {
                        if (!selected) return "Select employee";
                        const employee = employees.find(
                          (item) => String(item.employee_id) === String(selected)
                        );
                        return employee
                          ? `${employee.name} (${employee.email})`
                          : "Select employee";
                      }}
                    >
                      <MenuItem value="">
                        <em>Select employee</em>
                      </MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.name} ({employee.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    required
                    label="Base Salary"
                    name="base_salary"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    value={salaryForm.base_salary}
                    onChange={onSalaryChange}
                    className="salary-management-input"
                  />

                  <TextField
                    fullWidth
                    required
                    label="Effective Date"
                    name="effective_date"
                    type="date"
                    value={salaryForm.effective_date}
                    onChange={onSalaryChange}
                    InputLabelProps={{ shrink: true }}
                    className="salary-management-input"
                  />

                  <Button fullWidth variant="contained" type="submit" className="salary-management-submit-btn">
                    Save Salary Version
                  </Button>
                </Box>
              </Box>

              <Typography className="salary-management-muted-text" sx={{ mt: 1.5 }}>
                Each salary update creates a new record. Existing salary rows are not overwritten.
              </Typography>
            </Box>

            <Divider className="salary-management-divider" />

            <Box>
              <Typography variant="h5" fontWeight={800} className="salary-management-section-title" sx={{ mb: 2 }}>
                Monthly Salary Issuance
              </Typography>

              <Box component="form" onSubmit={handleIssueSubmit}>
                <Box className="salary-management-form-grid salary-management-issue-grid">
                  <FormControl fullWidth required className="salary-management-input salary-management-select">
                    <InputLabel id="issue-employee-label">Employee</InputLabel>
                    <Select
                      labelId="issue-employee-label"
                      label="Employee"
                      name="employee_id"
                      value={issueForm.employee_id}
                      onChange={onIssueChange}
                      MenuProps={employeeMenuProps}
                      renderValue={(selected) => {
                        if (!selected) return "Select employee";
                        const employee = employees.find(
                          (item) => String(item.employee_id) === String(selected)
                        );
                        return employee
                          ? `${employee.name} (${employee.email})`
                          : "Select employee";
                      }}
                    >
                      <MenuItem value="">
                        <em>Select employee</em>
                      </MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.name} ({employee.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    required
                    label="Payroll Month"
                    name="payroll_month"
                    type="month"
                    value={issueForm.payroll_month}
                    onChange={onIssueChange}
                    InputLabelProps={{ shrink: true }}
                    className="salary-management-input"
                  />

                  <TextField
                    fullWidth
                    label="Deductions"
                    name="deduction_amount"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    value={issueForm.deduction_amount}
                    onChange={onIssueChange}
                    className="salary-management-input"
                  />

                  <Button variant="contained" color="success" type="submit" className="salary-management-issue-btn">
                    Issue Payroll
                  </Button>

                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Remarks"
                    name="remarks"
                    value={issueForm.remarks}
                    onChange={onIssueChange}
                    placeholder="Optional note such as CPF employee contribution"
                    className="salary-management-input salary-management-remarks-field"
                    sx={{ gridColumn: { xs: "1 / -1" } }}
                  />
                </Box>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ mt: 2 }}
              >
                <TextField
                  type="month"
                  value={bulkMonth}
                  onChange={(e) => setBulkMonth(e.target.value)}
                  className="salary-management-input salary-management-bulk-month"
                />
                <Button
                  variant="contained"
                  type="button"
                  onClick={handleBulkIssue}
                  className="salary-management-bulk-btn"
                  sx={{ width: { xs: "100%", sm: 160 } }}
                >
                  Issue Bulk Payroll
                </Button>
              </Stack>

              <Typography className="salary-management-muted-text" sx={{ mt: 1.5 }}>
                The system prevents issuing salary twice for the same employee and month.
              </Typography>
            </Box>

            <Divider className="salary-management-divider" />

            <Box>
              <Typography variant="h4" fontWeight={800} className="salary-management-table-title" sx={{ mb: 2 }}>
                Current Salary Records
              </Typography>

              <TableContainer className="salary-management-table-container" sx={{ backgroundColor: "#24293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="salary-management-table-head-cell">Employee</TableCell>
                      <TableCell className="salary-management-table-head-cell">Email</TableCell>
                      <TableCell className="salary-management-table-head-cell">Department</TableCell>
                      <TableCell className="salary-management-table-head-cell">Base Salary</TableCell>
                      <TableCell className="salary-management-table-head-cell">Effective Date</TableCell>
                      <TableCell className="salary-management-table-head-cell">Updated By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.employee_id} hover>
                        <TableCell className="salary-management-table-body-cell">{employee.name}</TableCell>
                        <TableCell className="salary-management-table-body-cell">{employee.email}</TableCell>
                        <TableCell className="salary-management-table-body-cell">{employee.department || "-"}</TableCell>
                        <TableCell className="salary-management-table-body-cell">
                          {employee.base_salary !== null
                            ? currency(employee.base_salary)
                            : "Not set"}
                        </TableCell>
                        <TableCell className="salary-management-table-body-cell">{employee.effective_date || "-"}</TableCell>
                        <TableCell className="salary-management-table-body-cell">{employee.updated_by || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider className="salary-management-divider" />

            <Box>
              <Typography variant="h4" fontWeight={800} className="salary-management-table-title" sx={{ mb: 2 }}>
                Payroll History
              </Typography>

              <TableContainer className="salary-management-table-container" sx={{ backgroundColor: "#24293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="salary-management-table-head-cell">Employee</TableCell>
                      <TableCell className="salary-management-table-head-cell">Month</TableCell>
                      <TableCell className="salary-management-table-head-cell">Base Salary</TableCell>
                      <TableCell className="salary-management-table-head-cell">Deductions</TableCell>
                      <TableCell className="salary-management-table-head-cell">Net Pay</TableCell>
                      <TableCell className="salary-management-table-head-cell">Status</TableCell>
                      <TableCell className="salary-management-table-head-cell">Issued By</TableCell>
                      <TableCell className="salary-management-table-head-cell">Issued At</TableCell>
                      <TableCell className="salary-management-table-head-cell">Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrolls.length === 0 ? (
                      <TableRow>
                        <TableCell className="salary-management-table-body-cell" colSpan={9}>
                          No payroll records yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrolls.map((payroll) => (
                        <TableRow key={payroll.id} hover>
                          <TableCell className="salary-management-table-body-cell">{payroll.employee_name}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.payroll_month}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{currency(payroll.base_salary)}</TableCell>
                          <TableCell className="salary-management-table-body-cell">
                            {currency(payroll.deduction_amount)}
                          </TableCell>
                          <TableCell className="salary-management-table-body-cell">{currency(payroll.net_pay)}</TableCell>
                          <TableCell className="salary-management-table-body-cell">
                            <Chip
                              size="small"
                              label={payroll.status}
                              className={`salary-management-chip ${payroll.status === "issued" ? "salary-management-chip-issued" : "salary-management-chip-correction"}`}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.issued_by_name || "-"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.issued_at}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.remarks || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={() => navigate("/dashboard")} className="salary-management-back-btn" sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700, backgroundColor: "#7a849e", "&:hover": { backgroundColor: "#6b758d" } }}>
                Back to Dashboard
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default SalaryManagementPage;
