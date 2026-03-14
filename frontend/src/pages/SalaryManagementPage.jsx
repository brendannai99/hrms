import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

const pageBg = "#2b3145";
const panelBg = "#2b3145";
const fieldBg = "#1f2436";
const borderColor = "rgba(255,255,255,0.12)";
const mutedText = "rgba(255,255,255,0.72)";
const tableHeadBg = "#39415a";
const cardBg = "#24293b";

const paperSx = {
  backgroundColor: panelBg,
  color: "#fff",
  border: `1px solid ${borderColor}`,
  borderRadius: 3,
  boxShadow: "none",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: fieldBg,
    color: "#fff",
    borderRadius: 1.5,
    minHeight: 56,
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.25)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.4)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#5b93ff",
    },
    "& input": {
      color: "#fff",
    },
    "& textarea": {
      color: "#fff",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.75)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#9db9ff",
  },
  "& .MuiSvgIcon-root": {
    color: "rgba(255,255,255,0.75)",
  },
};

const selectSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    alignItems: "center",
  },
  "& .MuiSelect-select": {
    color: "#fff",
    display: "flex",
    alignItems: "center",
    minHeight: "20px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingRight: "36px !important",
  },
};

const employeeMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: fieldBg,
      color: "#fff",
      border: `1px solid ${borderColor}`,
      minWidth: 320,
      maxWidth: 520,
      "& .MuiMenuItem-root": {
        whiteSpace: "normal",
        wordBreak: "break-word",
        lineHeight: 1.35,
        py: 1.2,
      },
      "& .MuiMenuItem-root:hover": {
        bgcolor: "rgba(91,147,255,0.15)",
      },
      "& .MuiMenuItem-root.Mui-selected": {
        bgcolor: "rgba(91,147,255,0.22)",
      },
    },
  },
};

const tableHeadCellSx = {
  color: "#fff",
  fontWeight: 700,
  backgroundColor: tableHeadBg,
  borderBottom: `1px solid ${borderColor}`,
  whiteSpace: "nowrap",
};

const tableBodyCellSx = {
  color: "#fff",
  borderBottom: `1px solid ${borderColor}`,
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
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: pageBg,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Typography color="#fff">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: pageBg, py: 1 }}>
      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Paper sx={{ ...paperSx, p: { xs: 2, md: 3 } }}>
          <Stack spacing={3}>
            <Typography variant="h3" fontWeight={800} color="#fff">
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
                <Paper sx={{ ...paperSx, backgroundColor: cardBg, p: 2 }}>
                  <Typography color={mutedText} variant="body2">
                    Employees With Salary
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mt: 0.5 }}>
                    {totals.employeesWithSalary}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ ...paperSx, backgroundColor: cardBg, p: 2 }}>
                  <Typography color={mutedText} variant="body2">
                    Payroll Issued Rows
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mt: 0.5 }}>
                    {totals.payrollsIssued}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ ...paperSx, backgroundColor: cardBg, p: 2 }}>
                  <Typography color={mutedText} variant="body2">
                    Correction Rows
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mt: 0.5 }}>
                    {totals.corrections}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: borderColor }} />

            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff" sx={{ mb: 2 }}>
                Admin-Only Salary Update
              </Typography>

              <Box component="form" onSubmit={handleSalarySubmit}>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required sx={selectSx}>
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
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      required
                      label="Base Salary"
                      name="base_salary"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      value={salaryForm.base_salary}
                      onChange={onSalaryChange}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      required
                      label="Effective Date"
                      name="effective_date"
                      type="date"
                      value={salaryForm.effective_date}
                      onChange={onSalaryChange}
                      InputLabelProps={{ shrink: true }}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      sx={{
                        minHeight: 56,
                        height: "100%",
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: "#5b93ff",
                        "&:hover": { bgcolor: "#4c82ec" },
                      }}
                    >
                      Save Salary Version
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Typography color={mutedText} sx={{ mt: 1.5 }}>
                Each salary update creates a new record. Existing salary rows are not overwritten.
              </Typography>
            </Box>

            <Divider sx={{ borderColor: borderColor }} />

            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff" sx={{ mb: 2 }}>
                Monthly Salary Issuance
              </Typography>

              <Box component="form" onSubmit={handleIssueSubmit}>
                <Grid container spacing={2} alignItems="stretch">
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required sx={selectSx}>
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
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      required
                      label="Payroll Month"
                      name="payroll_month"
                      type="month"
                      value={issueForm.payroll_month}
                      onChange={onIssueChange}
                      InputLabelProps={{ shrink: true }}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Deductions"
                      name="deduction_amount"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      value={issueForm.deduction_amount}
                      onChange={onIssueChange}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      type="submit"
                      sx={{
                        minHeight: 56,
                        height: "100%",
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: "#33a266",
                        "&:hover": { bgcolor: "#2c8c59" },
                      }}
                    >
                      Issue Payroll
                    </Button>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Remarks"
                      name="remarks"
                      value={issueForm.remarks}
                      onChange={onIssueChange}
                      placeholder="Optional note such as CPF employee contribution"
                      sx={inputSx}
                    />
                  </Grid>
                </Grid>
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
                  sx={{ ...inputSx, width: { xs: "100%", sm: 175 } }}
                />
                <Button
                  variant="contained"
                  type="button"
                  onClick={handleBulkIssue}
                  sx={{
                    minHeight: 40,
                    width: { xs: "100%", sm: 160 },
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#5b93ff",
                    "&:hover": { bgcolor: "#4c82ec" },
                  }}
                >
                  Issue Bulk Payroll
                </Button>
              </Stack>

              <Typography color={mutedText} sx={{ mt: 1.5 }}>
                The system prevents issuing salary twice for the same employee and month.
              </Typography>
            </Box>

            <Divider sx={{ borderColor: borderColor }} />

            <Box>
              <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mb: 2 }}>
                Current Salary Records
              </Typography>

              <TableContainer
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${borderColor}`,
                  backgroundColor: cardBg,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeadCellSx}>Employee</TableCell>
                      <TableCell sx={tableHeadCellSx}>Email</TableCell>
                      <TableCell sx={tableHeadCellSx}>Department</TableCell>
                      <TableCell sx={tableHeadCellSx}>Base Salary</TableCell>
                      <TableCell sx={tableHeadCellSx}>Effective Date</TableCell>
                      <TableCell sx={tableHeadCellSx}>Updated By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.employee_id} hover>
                        <TableCell sx={tableBodyCellSx}>{employee.name}</TableCell>
                        <TableCell sx={tableBodyCellSx}>{employee.email}</TableCell>
                        <TableCell sx={tableBodyCellSx}>{employee.department || "-"}</TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          {employee.base_salary !== null
                            ? currency(employee.base_salary)
                            : "Not set"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>{employee.effective_date || "-"}</TableCell>
                        <TableCell sx={tableBodyCellSx}>{employee.updated_by || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider sx={{ borderColor: borderColor }} />

            <Box>
              <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mb: 2 }}>
                Payroll History
              </Typography>

              <TableContainer
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${borderColor}`,
                  backgroundColor: cardBg,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeadCellSx}>Employee</TableCell>
                      <TableCell sx={tableHeadCellSx}>Month</TableCell>
                      <TableCell sx={tableHeadCellSx}>Base Salary</TableCell>
                      <TableCell sx={tableHeadCellSx}>Deductions</TableCell>
                      <TableCell sx={tableHeadCellSx}>Net Pay</TableCell>
                      <TableCell sx={tableHeadCellSx}>Status</TableCell>
                      <TableCell sx={tableHeadCellSx}>Issued By</TableCell>
                      <TableCell sx={tableHeadCellSx}>Issued At</TableCell>
                      <TableCell sx={tableHeadCellSx}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrolls.length === 0 ? (
                      <TableRow>
                        <TableCell sx={tableBodyCellSx} colSpan={9}>
                          No payroll records yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrolls.map((payroll) => (
                        <TableRow key={payroll.id} hover>
                          <TableCell sx={tableBodyCellSx}>{payroll.employee_name}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{payroll.payroll_month}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{currency(payroll.base_salary)}</TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            {currency(payroll.deduction_amount)}
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>{currency(payroll.net_pay)}</TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <Chip
                              size="small"
                              label={payroll.status}
                              sx={{
                                color: "#fff",
                                borderColor:
                                  payroll.status === "issued" ? "#5b93ff" : "#f0ad4e",
                                backgroundColor:
                                  payroll.status === "issued"
                                    ? "rgba(91,147,255,0.12)"
                                    : "rgba(240,173,78,0.12)",
                              }}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>{payroll.issued_by_name || "-"}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{payroll.issued_at}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{payroll.remarks || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={() => navigate("/dashboard")}
                sx={{
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#7a849e",
                  "&:hover": { bgcolor: "#6b758d" },
                }}
              >
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