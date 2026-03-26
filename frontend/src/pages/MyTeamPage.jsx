import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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

function MyTeamPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [myTeam, setMyTeam] = useState([]);
  const [openPeriods, setOpenPeriods] = useState([]);
  const [teamRatings, setTeamRatings] = useState([]);

  const labels = {
    1: "Poor",
    2: "Below Average",
    3: "Average",
    4: "Good",
    5: "Excellent" 
  }

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal States
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Form State
  const [ratingForm, setRatingForm] = useState({ review_period_id: "", rating: "", comments: "" });

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const meRes = await api.get("/auth/me");
      const user = meRes.data;
      setCurrentUser(user);

      const [orgRes, periodsRes, ratingsRes] = await Promise.all([
        api.get("/org/tree"),
        api.get("/performance/periods"),
        api.get("/performance/ratings/team")
      ]);

      const reports = orgRes.data.filter(emp => Number(emp.manager_id) === Number(user.id));
      setMyTeam(reports);
      
      setOpenPeriods(periodsRes.data.filter(p => p.is_open));
      setTeamRatings(ratingsRes.data);
    } catch (err) {
      setError("Failed to load team data.");
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

  const handleOpenSubmit = (employee) => {
    setSelectedEmployee(employee);
    setRatingForm({ review_period_id: "", rating: "", comments: "" });
    setError(""); setSuccess("");
    setSubmitModalOpen(true);
  };

  const handleOpenView = (employee) => {
    setSelectedEmployee(employee);
    setError(""); setSuccess("");
    setViewModalOpen(true);
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.post("/performance/ratings", {
        employee_id: selectedEmployee.id,
        review_period_id: Number(ratingForm.review_period_id),
        rating: Number(ratingForm.rating),
        comments: ratingForm.comments,
      });
      setSuccess(`Review submitted for ${selectedEmployee.name}!`);
      setSubmitModalOpen(false);
      loadData(); 
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit rating.");
    }
  };

  if (!currentUser) return <Typography sx={{ color: "white", textAlign: "center", mt: 5 }}>Loading...</Typography>;

  // --- SMART DATA FILTERING ---
  const employeeHistory = teamRatings.filter(r => r.employee_id === selectedEmployee?.id);
  
  // Only show periods where this employee does NOT already have a rating
  const availablePeriods = openPeriods.filter(
    period => !employeeHistory.some(history => history.review_period_id === period.id)
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#2b3145", py: 4 }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3" fontWeight={800} color="white">
            My Team
          </Typography>
          <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ backgroundColor: "#7a849e" }}>
            Back to Dashboard
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <TableContainer component={Paper} sx={{ backgroundColor: "#24293b", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1e2233" }}>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Role</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Department</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myTeam.length === 0 ? (
                <TableRow><TableCell colSpan={4} sx={{ color: "gray", textAlign: "center", py: 4 }}>You have no direct reports.</TableCell></TableRow>
              ) : (
                myTeam.map((emp) => (
                  <TableRow key={emp.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ color: "white" }}>{emp.name}</TableCell>
                    <TableCell sx={{ color: "gray" }}>{emp.role.toUpperCase()}</TableCell>
                    <TableCell sx={{ color: "gray" }}>{emp.department || "-"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" size="small" sx={{ color: "#90caf9", borderColor: "#90caf9" }} onClick={() => handleOpenView(emp)}>
                          View History
                        </Button>
                        <Button variant="contained" size="small" color="primary" onClick={() => handleOpenSubmit(emp)}>
                          Write Review
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ================= MODAL: SUBMIT REVIEW ================= */}
        <Dialog open={submitModalOpen} onClose={() => setSubmitModalOpen(false)} PaperProps={{ sx: { backgroundColor: "#2b3145", color: "white", minWidth: 400 } }}>
          <DialogTitle fontWeight="bold">Reviewing: {selectedEmployee?.name}</DialogTitle>
          <DialogContent>
            {/* If the available array is empty, hide the form! */}
            {availablePeriods.length === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                This employee has already been reviewed for all currently open periods. Great job!
              </Alert>
            ) : (
              <Box component="form" id="submit-review-form" onSubmit={handleSubmitRating} sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: "gray" }}>Review Period</InputLabel>
                  <Select
                    value={ratingForm.review_period_id}
                    onChange={(e) => setRatingForm({ ...ratingForm, review_period_id: e.target.value })}
                    label="Review Period"
                    sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "gray" } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: "#2b3145", color: "white" } } }}
                  >
                    {availablePeriods.map(p => <MenuItem key={p.id} value={p.id}>{p.period_name}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel sx={{ color: "gray" }}>Rating (1-5)</InputLabel>
                  <Select
                    value={ratingForm.rating}
                    onChange={(e) => setRatingForm({ ...ratingForm, rating: e.target.value })}
                    label="Rating (1-5)"
                    sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "gray" } }}
                    MenuProps={{ PaperProps: { sx: { bgcolor: "#2b3145", color: "white" } } }}
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
  <MenuItem key={num} value={num}>
    {num} - {labels[num]}
  </MenuItem>
))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth required multiline rows={4} label="Comments"
                  value={ratingForm.comments}
                  onChange={(e) => setRatingForm({ ...ratingForm, comments: e.target.value })}
                  InputLabelProps={{ style: { color: 'gray' } }} InputProps={{ style: { color: 'white' } }}
                  sx={{ ".MuiOutlinedInput-notchedOutline": { borderColor: "gray" } }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSubmitModalOpen(false)} sx={{ color: "gray" }}>{availablePeriods.length === 0 ? "Close" : "Cancel"}</Button>
            {availablePeriods.length > 0 && (
              <Button type="submit" form="submit-review-form" variant="contained" color="primary">Submit Rating</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* ================= MODAL: VIEW HISTORY ================= */}
        <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { backgroundColor: "#2b3145", color: "white" } }}>
          <DialogTitle fontWeight="bold">Performance History: {selectedEmployee?.name}</DialogTitle>
          <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
            {employeeHistory.length === 0 ? (
              <Typography color="gray" textAlign="center" py={3}>No past reviews found for this employee.</Typography>
            ) : (
              <Stack spacing={2}>
                {employeeHistory.map(review => (
                  <Paper key={review.id} sx={{ p: 2, backgroundColor: "#1e2233", color: "white" }}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold" color="#90caf9">{review.period_name}</Typography>
                      <Chip label={`Rating: ${review.rating} / 5`} color={review.rating >= 4 ? "success" : review.rating <= 2 ? "error" : "primary"} size="small" />
                    </Stack>
                    <Typography variant="body2" sx={{ fontStyle: "italic", mb: 1 }}>"{review.comments}"</Typography>
                    <Typography variant="caption" color="gray">Submitted on {new Date(review.created_at).toLocaleDateString('en-GB')}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewModalOpen(false)} sx={{ color: "gray" }}>Close</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
}

export default MyTeamPage;