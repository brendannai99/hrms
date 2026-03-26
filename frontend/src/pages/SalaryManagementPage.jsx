import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import api from "../services/api";
import "../css/SalaryManagement.css";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TablePagination,
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

const salarySchema = yup.object({
  employee_id: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? NaN : value))
    .typeError("Employee is required")
    .integer("Employee is required")
    .positive("Employee is required")
    .required("Employee is required"),
  base_salary: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? NaN : value))
    .typeError("Base salary must be a valid number")
    .min(0, "Base salary cannot be negative")
    .required("Base salary is required"),
  effective_date: yup
    .string()
    .required("Effective date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Effective date must be in YYYY-MM-DD format"),
});

const auditActionOptions = [
  "",
  "VIEW_OWN_SALARY",
  "VIEW_ALL_SALARY_RECORDS",
  "VIEW_EMPLOYEE_SALARY_HISTORY",
  "VIEW_OWN_SALARY_HISTORY",
  "VIEW_ALL_PAYROLL_RECORDS",
  "VIEW_OWN_PAYROLL_HISTORY",
  "UPDATE_SALARY",
  "ISSUE_PAYROLL",
  "ISSUE_PAYROLL_CORRECTION",
];

const auditTargetTypeOptions = ["", "salary_record", "payroll_record"];

function SalaryManagementPage() {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [salaryErrors, setSalaryErrors] = useState({});
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
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({ amount_delta: "", remarks: "" });
  const [correctionError, setCorrectionError] = useState("");


  const [bulkMonth, setBulkMonth] = useState(currentMonthValue());
  const [auditFilters, setAuditFilters] = useState({
    search: "",
    actor: "",
    action: "",
    target_type: "",
    page: 0,
    rowsPerPage: 10,
  });
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const navigate = useNavigate();

  const loadPage = async (auditState = auditFilters) => {
    try {
      const auditParams = new URLSearchParams({
        page: String(auditState.page + 1),
        limit: String(auditState.rowsPerPage),
      });

      if (auditState.search.trim()) auditParams.set("search", auditState.search.trim());
      if (auditState.actor.trim()) auditParams.set("actor", auditState.actor.trim());
      if (auditState.action) auditParams.set("action", auditState.action);
      if (auditState.target_type) auditParams.set("target_type", auditState.target_type);

      const [meRes, salaryRes, payrollRes, auditRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/salary/salary-records"),
        api.get("/salary/payroll-records?scope=all"),
        api.get(`/salary/audit-logs?${auditParams.toString()}`),
      ]);

      if (meRes.data.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setUser(meRes.data);
      setEmployees(salaryRes.data);
      setPayrolls(payrollRes.data);
      setAuditLogs(auditRes.data.data || []);
      setAuditPagination(
        auditRes.data.pagination || {
          page: auditState.page + 1,
          limit: auditState.rowsPerPage,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load salary management page");
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  useEffect(() => {
    loadPage(auditFilters);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadPage(auditFilters);
  }, [auditFilters.page, auditFilters.rowsPerPage, auditFilters.action, auditFilters.target_type]);

  const totals = useMemo(
    () => ({
      employeesWithSalary: employees.filter((item) => item.salary_record_id).length,
      payrollsIssued: payrolls.filter((item) => item.status === "issued").length,
      corrections: payrolls.filter((item) => String(item.status || "").startsWith("correction")).length,
    }),
    [employees, payrolls]
  );

  const correctedOriginalIds = useMemo(() => {
    const ids = new Set();
    payrolls.forEach((item) => {
      if (String(item.status || "").startsWith("correction") && item.correction_of_payroll_id) {
        ids.add(item.correction_of_payroll_id);
      }
    });
    return ids;
  }, [payrolls]);

  const onSalaryChange = async (e) => {
    const nextForm = { ...salaryForm, [e.target.name]: e.target.value };
    setSalaryForm(nextForm);

    try {
      await salarySchema.validateAt(e.target.name, nextForm);
      setSalaryErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    } catch (validationError) {
      setSalaryErrors((prev) => ({ ...prev, [e.target.name]: validationError.message }));
    }
  };

  const onIssueChange = (e) =>
    setIssueForm({ ...issueForm, [e.target.name]: e.target.value });

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const validated = await salarySchema.validate(salaryForm, { abortEarly: false });
      setSalaryErrors({});

      const res = await api.post("/salary/salary-records", {
        employee_id: Number(validated.employee_id),
        base_salary: Number(validated.base_salary),
        effective_date: validated.effective_date,
      });

      setMessage(res.data.message);
      setSalaryForm({
        employee_id: "",
        base_salary: "",
        effective_date: todayValue(),
      });

      await loadPage(auditFilters);
    } catch (err) {
      if (err.name === "ValidationError") {
        const nextErrors = {};
        err.inner.forEach((item) => {
          if (item.path && !nextErrors[item.path]) {
            nextErrors[item.path] = item.message;
          }
        });
        setSalaryErrors(nextErrors);
        return;
      }

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

      await loadPage(auditFilters);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to issue payroll");
    }
  };
  const openCorrectionDialog = (payroll) => {
    setCorrectionTarget(payroll);
    setCorrectionForm({ amount_delta: "", remarks: "" });
    setCorrectionError("");
    setCorrectionOpen(true);
  };

  const closeCorrectionDialog = () => {
    setCorrectionOpen(false);
    setCorrectionTarget(null);
    setCorrectionForm({ amount_delta: "", remarks: "" });
    setCorrectionError("");
  };

  const submitCorrection = async () => {
    if (!correctionTarget) return;
    setMessage("");
    setError("");
    setCorrectionError("");

    const delta = Number(correctionForm.amount_delta);
    const remarks = String(correctionForm.remarks || "").trim();

    if (Number.isNaN(delta) || delta === 0) {
      return setCorrectionError("Amount delta must be a non-zero number (positive or negative).");
    }
    if (!remarks) {
      return setCorrectionError("Remarks are required for auditability.");
    }

    try {
      await api.post(`/salary/payroll-records/${correctionTarget.id}/corrections`, {
        amount_delta: delta,
        remarks,
      });

      setMessage("Correction record issued successfully.");
      closeCorrectionDialog();
      await refreshPayrollRecords();
    } catch (err) {
      setCorrectionError(err.response?.data?.error || "Failed to issue correction record");
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

      await loadPage(auditFilters);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to run bulk payroll");
    }
  };

  const handleAuditFilterChange = (e) => {
    const { name, value } = e.target;
    setAuditFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyAuditFilters = async () => {
    const nextFilters = { ...auditFilters, page: 0 };
    setAuditFilters(nextFilters);
    await loadPage(nextFilters);
  };

  const clearAuditFilters = async () => {
    const resetFilters = {
      search: "",
      actor: "",
      action: "",
      target_type: "",
      page: 0,
      rowsPerPage: auditFilters.rowsPerPage,
    };
    setAuditFilters(resetFilters);
    await loadPage(resetFilters);
  };

  if (!user) {
    return (
      <Box
        className="salary-management-page"
        sx={{
          minHeight: "100vh",
          backgroundColor: "#2b3145",
          display: "grid",
          placeItems: "center",
          py: 3,
        }}
      >
        <Typography className="salary-management-loading">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="salary-management-page"
      sx={{ minHeight: "100vh", backgroundColor: "#2b3145", py: 3 }}
    >
      <Container maxWidth="xl" className="salary-management-container" sx={{ py: 0 }}>
        <Paper
          className="salary-management-panel"
          sx={{
            p: { xs: 2, md: 3 },
            backgroundColor: "#2b3145",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 3,
            boxShadow: "none",
          }}
        >
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
                  <Typography className="salary-management-muted-text" variant="body2">Employees With Salary</Typography>
                  <Typography variant="h4" fontWeight={800} className="salary-management-card-value" sx={{ mt: 0.5 }}>{totals.employeesWithSalary}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="salary-management-card" sx={{ p: 2, backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
                  <Typography className="salary-management-muted-text" variant="body2">Payroll Issued Rows</Typography>
                  <Typography variant="h4" fontWeight={800} className="salary-management-card-value" sx={{ mt: 0.5 }}>{totals.payrollsIssued}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="salary-management-card" sx={{ p: 2, backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
                  <Typography className="salary-management-muted-text" variant="body2">Correction Rows</Typography>
                  <Typography variant="h4" fontWeight={800} className="salary-management-card-value" sx={{ mt: 0.5 }}>{totals.corrections}</Typography>
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
                  <FormControl fullWidth required error={Boolean(salaryErrors.employee_id)} className="salary-management-input salary-management-select salary-management-salary-select">
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
                        const employee = employees.find((item) => String(item.employee_id) === String(selected));
                        return employee ? `${employee.name} (${employee.email})` : "Select employee";
                      }}
                    >
                      <MenuItem value=""><em>Select employee</em></MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.name} ({employee.email})
                        </MenuItem>
                      ))}
                    </Select>
                    {salaryErrors.employee_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.75, ml: 1.75 }}>
                        {salaryErrors.employee_id}
                      </Typography>
                    )}
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
                    error={Boolean(salaryErrors.base_salary)}
                    helperText={salaryErrors.base_salary || " "}
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
                    error={Boolean(salaryErrors.effective_date)}
                    helperText={salaryErrors.effective_date || " "}
                  />

                  <Button fullWidth variant="contained" type="submit" className="salary-management-submit-btn">
                    Save Salary Version
                  </Button>
                </Box>
              </Box>
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
                        const employee = employees.find((item) => String(item.employee_id) === String(selected));
                        return employee ? `${employee.name} (${employee.email})` : "Select employee";
                      }}
                    >
                      <MenuItem value=""><em>Select employee</em></MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.name} ({employee.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField fullWidth required label="Payroll Month" name="payroll_month" type="month" value={issueForm.payroll_month} onChange={onIssueChange} InputLabelProps={{ shrink: true }} className="salary-management-input" />

                  <TextField fullWidth label="Deductions" name="deduction_amount" type="number" inputProps={{ min: 0, step: "0.01" }} value={issueForm.deduction_amount} onChange={onIssueChange} className="salary-management-input" />

                  <Button variant="contained" color="success" type="submit" className="salary-management-issue-btn">Issue Payroll</Button>

                  <TextField fullWidth multiline minRows={3} label="Remarks" name="remarks" value={issueForm.remarks} onChange={onIssueChange} placeholder="Optional note such as CPF employee contribution" className="salary-management-input salary-management-remarks-field" sx={{ gridColumn: { xs: "1 / -1" } }} />
                </Box>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mt: 2 }}>
                <TextField type="month" value={bulkMonth} onChange={(e) => setBulkMonth(e.target.value)} className="salary-management-input salary-management-bulk-month" />
                <Button variant="contained" type="button" onClick={handleBulkIssue} className="salary-management-bulk-btn" sx={{ width: { xs: "100%", sm: 160 } }}>Issue Bulk Payroll</Button>
              </Stack>
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
                        <TableCell className="salary-management-table-body-cell">{employee.base_salary !== null ? currency(employee.base_salary) : "Not set"}</TableCell>
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
                      {user?.role === "admin" && (
                        <TableCell className="salary-management-table-head-cell">Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrolls.length === 0 ? (
                      <TableRow>
                        <TableCell className="salary-management-table-body-cell" colSpan={user?.role === "admin" ? 10 : 9}>No payroll records yet.</TableCell>
                      </TableRow>
                    ) : (
                      payrolls.map((payroll) => (
                        <TableRow key={payroll.id} hover>
                          <TableCell className="salary-management-table-body-cell">{payroll.employee_name}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.payroll_month}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{currency(payroll.base_salary)}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{currency(payroll.deduction_amount)}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{currency(payroll.net_pay)}</TableCell>
                          <TableCell className="salary-management-table-body-cell">
                            <Chip size="small" label={payroll.status} className={`salary-management-chip ${String(payroll.status || "").toLowerCase() === "issued" ? "salary-management-chip-issued" : "salary-management-chip-correction"}`} variant="outlined" />
                          </TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.issued_by_name || "-"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.issued_at}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{payroll.remarks || "-"}</TableCell>
                          {user?.role === "admin" && (
                            <TableCell className="salary-management-table-body-cell">
                              {String(payroll.status || "").toLowerCase() === "issued" && !correctedOriginalIds.has(payroll.id) ? (
                                <Button size="small" variant="outlined" onClick={() => openCorrectionDialog(payroll)}>
                                  Issue correction
                                </Button>
                              ) : (
                                <Typography variant="caption" className="salary-management-muted-text">
                                  {String(payroll.status || "").startsWith("correction") ? "Correction row" : correctedOriginalIds.has(payroll.id) ? "Corrected" : "-"}
                                </Typography>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider className="salary-management-divider" />

            <Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={800} className="salary-management-table-title">
                  Audit Log
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", md: "auto" } }}>
                  <TextField size="small" label="Search" name="search" value={auditFilters.search} onChange={handleAuditFilterChange} className="salary-management-input" />
                  <TextField size="small" label="Actor" name="actor" value={auditFilters.actor} onChange={handleAuditFilterChange} className="salary-management-input" />
                  <FormControl size="small" className="salary-management-input salary-management-select" sx={{ minWidth: 180 }}>
                    <InputLabel id="audit-action-label">Action</InputLabel>
                    <Select labelId="audit-action-label" label="Action" name="action" value={auditFilters.action} onChange={handleAuditFilterChange}>
                      {auditActionOptions.map((option) => (
                        <MenuItem key={option || "all-actions"} value={option}>{option || "All actions"}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" className="salary-management-input salary-management-select" sx={{ minWidth: 170 }}>
                    <InputLabel id="audit-target-label">Target Type</InputLabel>
                    <Select labelId="audit-target-label" label="Target Type" name="target_type" value={auditFilters.target_type} onChange={handleAuditFilterChange}>
                      {auditTargetTypeOptions.map((option) => (
                        <MenuItem key={option || "all-types"} value={option}>{option || "All target types"}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={applyAuditFilters}>Apply</Button>
                  <Button variant="outlined" onClick={clearAuditFilters}>Clear</Button>
                </Stack>
              </Stack>

              <TableContainer className="salary-management-table-container" sx={{ backgroundColor: "#24293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="salary-management-table-head-cell">When</TableCell>
                      <TableCell className="salary-management-table-head-cell">Actor</TableCell>
                      <TableCell className="salary-management-table-head-cell">Action</TableCell>
                      <TableCell className="salary-management-table-head-cell">Target Type</TableCell>
                      <TableCell className="salary-management-table-head-cell">Target ID</TableCell>
                      <TableCell className="salary-management-table-head-cell">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell className="salary-management-table-body-cell" colSpan={6}>No audit logs found for the selected filter.</TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell className="salary-management-table-body-cell">{log.created_at || "-"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{log.actor_name || "System"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{log.action || "-"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{log.target_type || "-"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{log.target_id ?? "-"}</TableCell>
                          <TableCell className="salary-management-table-body-cell">{log.details || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={auditPagination.total}
                  page={auditFilters.page}
                  onPageChange={(_, nextPage) => setAuditFilters((prev) => ({ ...prev, page: nextPage }))}
                  rowsPerPage={auditFilters.rowsPerPage}
                  onRowsPerPageChange={(e) =>
                    setAuditFilters((prev) => ({
                      ...prev,
                      rowsPerPage: Number(e.target.value),
                      page: 0,
                    }))
                  }
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  sx={{
                    color: "#fff",
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    ".MuiTablePagination-selectLabel": {
                      color: "#fff",
                    },
                    ".MuiTablePagination-displayedRows": {
                      color: "#fff",
                    },
                    ".MuiInputBase-root": {
                      color: "#fff",
                    },
                    ".MuiSelect-select": {
                      color: "#fff",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#fff",
                    },
                    ".MuiIconButton-root": {
                      color: "#fff",
                    },
                    ".MuiIconButton-root.Mui-disabled": {
                      color: "rgba(255,255,255,0.35)",
                    },
                  }}
                />
              </TableContainer>
            </Box>


            <Dialog
              open={correctionOpen}
              onClose={closeCorrectionDialog}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                className: "salary-management-dialog-paper",
              }}
            >
              <DialogTitle className="salary-management-dialog-title">
                Issue payroll correction
              </DialogTitle>

              <DialogContent className="salary-management-dialog-content">
                {correctionError && (
                  <Alert severity="error" sx={{ mt: 1, mb: 2, borderRadius: 2 }}>
                    {correctionError}
                  </Alert>
                )}

                <Typography variant="body2" className="salary-management-muted-text" sx={{ mb: 2 }}>
                  Target payroll ID: <strong>{correctionTarget?.id}</strong> • Employee:{" "}
                  <strong>{correctionTarget?.employee_name}</strong> • Month:{" "}
                  <strong>{correctionTarget?.payroll_month}</strong>
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Amount delta (SGD)"
                    value={correctionForm.amount_delta}
                    onChange={(e) =>
                      setCorrectionForm((prev) => ({ ...prev, amount_delta: e.target.value }))
                    }
                    helperText="Positive = increase net pay, Negative = decrease net pay"
                    className="salary-management-input"
                    fullWidth
                  />
                  <TextField
                    label="Remarks"
                    value={correctionForm.remarks}
                    onChange={(e) =>
                      setCorrectionForm((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    className="salary-management-input"
                    multiline
                    minRows={3}
                    fullWidth
                  />
                </Stack>
              </DialogContent>

              <DialogActions className="salary-management-dialog-actions">
                <Button onClick={closeCorrectionDialog} variant="outlined">
                  Cancel
                </Button>
                <Button onClick={submitCorrection} variant="contained">
                  Issue correction
                </Button>
              </DialogActions>
            </Dialog>


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