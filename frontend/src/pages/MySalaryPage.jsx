import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

const pageBg = "#2b3145";
const panelBg = "#2b3145";
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

const statCardSx = {
  ...paperSx,
  backgroundColor: cardBg,
  p: 2.5,
  height: "100%",
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
  verticalAlign: "top",
};

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
          api.get("/salary/payroll-records"),
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
    <Box sx={{ minHeight: "100vh", backgroundColor: pageBg, py: 3 }}>
      <Container maxWidth="xl">
        <Paper sx={{ ...paperSx, p: { xs: 2, md: 3 } }}>
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={800} color="#fff">
              My Salary & Payment History
            </Typography>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={statCardSx}>
                  <Typography variant="body2" color={mutedText}>
                    Current Base Salary
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mt: 0.5 }}>
                    {salary ? currency(salary.base_salary) : "Not set"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={statCardSx}>
                  <Typography variant="body2" color={mutedText}>
                    Effective Date
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mt: 0.5 }}>
                    {salary?.effective_date || "-"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={statCardSx}>
                  <Typography variant="body2" color={mutedText}>
                    Total Payslips
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#fff" sx={{ mt: 0.5 }}>
                    {history.length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                backgroundColor: "rgba(91,147,255,0.12)",
                color: "#dbe7ff",
                border: "1px solid rgba(91,147,255,0.3)",
                "& .MuiAlert-icon": {
                  color: "#9db9ff",
                },
              }}
            >
              Employees can only view their own salary and payment history.
            </Alert>

            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff" sx={{ mb: 2 }}>
                Payment History
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
                      <TableCell sx={tableHeadCellSx}>Payroll Month</TableCell>
                      <TableCell sx={tableHeadCellSx}>Base Salary</TableCell>
                      <TableCell sx={tableHeadCellSx}>Deductions</TableCell>
                      <TableCell sx={tableHeadCellSx}>Net Pay</TableCell>
                      <TableCell sx={tableHeadCellSx}>Status</TableCell>
                      <TableCell sx={tableHeadCellSx}>Issued At</TableCell>
                      <TableCell sx={tableHeadCellSx}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell sx={tableBodyCellSx} colSpan={7} align="center">
                          No payroll records yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={tableBodyCellSx}>{item.payroll_month}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{currency(item.base_salary)}</TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            {currency(item.deduction_amount)}
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>{currency(item.net_pay)}</TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <Chip
                              size="small"
                              label={item.status}
                              variant="outlined"
                              sx={{
                                color: "#fff",
                                borderColor:
                                  item.status === "issued" ? "#5b93ff" : "#f0ad4e",
                                backgroundColor:
                                  item.status === "issued"
                                    ? "rgba(91,147,255,0.12)"
                                    : "rgba(240,173,78,0.12)",
                                textTransform: "capitalize",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>{item.issued_at || "-"}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{item.remarks || "-"}</TableCell>
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

export default MySalaryPage;