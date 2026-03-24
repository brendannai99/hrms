import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Alert, Box, Button, Chip, Container, Grid, Paper, Stack, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";

function PerformancePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const [periods, setPeriods] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [periodName, setPeriodName] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const meRes = await api.get("/auth/me");
      setCurrentUser(meRes.data);

      const [periodsRes, myRatingsRes] = await Promise.all([
        api.get("/performance/periods"),
        api.get("/performance/ratings/me"),
      ]);
      setPeriods(periodsRes.data);
      setMyRatings(myRatingsRes.data);
    } catch (err) {
      setError("Failed to load performance data");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      await api.post("/performance/periods", { period_name: periodName });
      setMessage("Review period created successfully");
      setPeriodName("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create period");
    }
  };

  const handleTogglePeriod = async (id, currentStatus) => {
    setError(""); setMessage("");
    try {
      await api.put(`/performance/periods/${id}/toggle`, { is_open: !currentStatus });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to toggle period");
    }
  };

  if (!currentUser) return <Typography sx={{ color: "white", textAlign: "center", mt: 5 }}>Loading...</Typography>;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#2b3145", py: 4 }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3" fontWeight={800} color="white">
            Performance Management
          </Typography>
          <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ backgroundColor: "#7a849e" }}>
            Back to Dashboard
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}

        <Paper sx={{ backgroundColor: "#24293b", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => { setActiveTab(newValue); setError(""); setMessage(""); }}
            textColor="inherit"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: "rgba(255,255,255,0.12)", px: 2 }}
          >
            <Tab label="My Performance" />
            {currentUser.role === "admin" && <Tab label="Manage Review Periods" />}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* TAB 0: MY PERFORMANCE */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>My Past Ratings</Typography>
                <TableContainer component={Paper} sx={{ backgroundColor: "#2b3145", color: "white" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Period</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Reviewer</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Rating (1-5)</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Comments</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myRatings.length === 0 ? (
                        <TableRow><TableCell colSpan={5} sx={{ color: "gray", textAlign: "center" }}>No ratings found.</TableCell></TableRow>
                      ) : (
                        myRatings.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell sx={{ color: "white" }}>{row.period_name}</TableCell>
                            <TableCell sx={{ color: "white" }}>{row.reviewer_name}</TableCell>
                            <TableCell sx={{ color: "white" }}><Chip label={`${row.rating} / 5`} color={row.rating >= 4 ? "success" : row.rating <= 2 ? "error" : "primary"} size="small" /></TableCell>
                            <TableCell sx={{ color: "white" }}>{row.comments}</TableCell>
                            <TableCell sx={{ color: "white" }}>{new Date(row.created_at).toLocaleDateString('en-GB')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 1: MANAGE PERIODS (ADMINS ONLY) */}
            {activeTab === 1 && currentUser.role === "admin" && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Configure Review Periods</Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Box component="form" onSubmit={handleCreatePeriod} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField required label="Period Name (e.g. Q1 2026)" value={periodName} onChange={(e) => setPeriodName(e.target.value)} InputLabelProps={{ style: { color: 'gray' } }} InputProps={{ style: { color: 'white' } }} sx={{ ".MuiOutlinedInput-notchedOutline": { borderColor: "gray" } }} />
                      <Button type="submit" variant="contained" color="primary">Create Period</Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TableContainer component={Paper} sx={{ backgroundColor: "#2b3145", color: "white" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Period Name</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Created</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {periods.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell sx={{ color: "white" }}>{row.period_name}</TableCell>
                              <TableCell sx={{ color: "white" }}>
                                <Chip label={row.is_open ? "OPEN" : "CLOSED"} color={row.is_open ? "success" : "default"} size="small" />
                              </TableCell>
                              <TableCell sx={{ color: "white" }}>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                              <TableCell sx={{ color: "white" }}>
                                <Button size="small" variant="outlined" color={row.is_open ? "error" : "success"} onClick={() => handleTogglePeriod(row.id, row.is_open)}>
                                  {row.is_open ? "Close Period" : "Open Period"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default PerformancePage;