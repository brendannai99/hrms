import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../css/MySalaryPage.css";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
} from "@mui/material";

function currency(value) {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function MySalaryPage() {
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [salaryRes, historyRes] = await Promise.all([
          api.get("/salary/my-salary"),
          api.get("/salary/payroll-records?scope=own"),
        ]);
        setSalary(salaryRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load salary information");
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    loadData();
  }, [navigate]);

  return (
    <Box className="my-salary-page" sx={{ minHeight: "100vh", backgroundColor: "#2b3145", py: 3 }}>
      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Paper className="my-salary-panel" sx={{ p: { xs: 2, md: 3 }, backgroundColor: "#2b3145", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none" }}>
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={800} className="my-salary-title">
              My Salary & Payment History
            </Typography>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper className="my-salary-card" sx={{ backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none", p: 2.5, height: "100%" }}>
                  <Typography variant="body2" className="my-salary-muted-text">
                    Current Base Salary
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="my-salary-card-value" sx={{ mt: 0.5 }}>
                    {salary ? currency(salary.base_salary) : "Not set"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="my-salary-card" sx={{ backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none", p: 2.5, height: "100%" }}>
                  <Typography variant="body2" className="my-salary-muted-text">
                    Effective Date
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="my-salary-card-value" sx={{ mt: 0.5 }}>
                    {salary?.effective_date || "-"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper className="my-salary-card" sx={{ backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, boxShadow: "none", p: 2.5, height: "100%" }}>
                  <Typography variant="body2" className="my-salary-muted-text">
                    Total Payslips
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="my-salary-card-value" sx={{ mt: 0.5 }}>
                    {history.length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="h5" fontWeight={800} className="my-salary-section-title" sx={{ mb: 2 }}>
                Payment History
              </Typography>

              <TableContainer className="my-salary-table-container" sx={{ backgroundColor: "#24293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, boxShadow: "none" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="my-salary-table-head-cell">Payroll Month</TableCell>
                      <TableCell className="my-salary-table-head-cell">Base Salary</TableCell>
                      <TableCell className="my-salary-table-head-cell">Deductions</TableCell>
                      <TableCell className="my-salary-table-head-cell">Net Pay</TableCell>
                      <TableCell className="my-salary-table-head-cell">Status</TableCell>
                      <TableCell className="my-salary-table-head-cell">Issued At</TableCell>
                      <TableCell className="my-salary-table-head-cell">Remarks</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell className="my-salary-table-body-cell" colSpan={7} align="center">
                          No payroll records yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell className="my-salary-table-body-cell">{item.payroll_month}</TableCell>
                          <TableCell className="my-salary-table-body-cell">{currency(item.base_salary)}</TableCell>
                          <TableCell className="my-salary-table-body-cell">
                            {currency(item.deduction_amount)}
                          </TableCell>
                          <TableCell className="my-salary-table-body-cell">{currency(item.net_pay)}</TableCell>
                          <TableCell className="my-salary-table-body-cell">
                            <Chip
                              size="small"
                              label={item.status}
                              variant="outlined"
                              className={`my-salary-chip ${item.status === "issued" ? "my-salary-chip-issued" : "my-salary-chip-correction"}`}
                            />
                          </TableCell>
                          <TableCell className="my-salary-table-body-cell">{item.issued_at || "-"}</TableCell>
                          <TableCell className="my-salary-table-body-cell">{item.remarks || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={() => navigate("/dashboard")} className="my-salary-back-btn" sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700, backgroundColor: "#7a849e", "&:hover": { backgroundColor: "#6b758d" } }}>
                Back to Dashboard
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default MySalaryPage;
