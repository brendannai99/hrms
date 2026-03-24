import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tree, TreeNode } from "react-organizational-chart";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import api from "../services/api";
import {
  Alert,
  Box,
  Button,
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
  Typography,
} from "@mui/material";

// ==========================================
// COMPONENT: The Visual Employee Card
// ==========================================
const EmployeeCard = ({ node, isRoot, employees, currentUser, lineage, revealedTeams, toggleTeam, expandUp, openReassignDialog, viewRootId }) => {
  const isMe = currentUser?.id === node.id;
  
  const allChildren = employees.filter(e => e.manager_id === node.id);
  const isTeamRevealed = revealedTeams.includes(node.id);
  
  const lineageChildrenCount = allChildren.filter(c => lineage.has(c.id)).length;
  const hasLateralPeers = allChildren.length > lineageChildrenCount;
  
  const visibleChildrenCount = allChildren.filter(c => isTeamRevealed || lineage.has(c.id)).length;
  const hiddenCount = allChildren.length - visibleChildrenCount;

  return (
    <Paper
      elevation={isMe ? 8 : 3}
      sx={{
        p: 2,
        display: "inline-block",
        backgroundColor: isMe ? "#1e2b4d" : "#24293b",
        color: "#fff",
        border: isMe ? "2px solid #64b5f6" : "1px solid rgba(255,255,255,0.12)",
        boxShadow: isMe ? "0 0 15px rgba(100, 181, 246, 0.4)" : "none",
        borderRadius: 2,
        minWidth: 160,
        position: "relative",
      }}
    >
      {isMe && (
        <Typography variant="caption" sx={{ position: "absolute", top: -10, left: 10, backgroundColor: "#64b5f6", color: "#000", px: 1, borderRadius: 1, fontWeight: "bold" }}>
          YOU
        </Typography>
      )}
      
      <Typography variant="subtitle1" fontWeight="bold">
        {node.name}
      </Typography>
      <Typography variant="body2" color={isMe ? "#90caf9" : "gray"}>
        {node.role.toUpperCase()}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 1 }}>
        {node.department || "No Dept"}
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
        {currentUser?.role === "admin" && (
          <Button size="small" variant="outlined" sx={{ fontSize: "0.65rem", color: "#90caf9", borderColor: "rgba(144, 202, 249, 0.5)" }} onClick={() => openReassignDialog(node)}>
            Reassign
          </Button>
        )}

        {isRoot && node.manager_id && (
          <Button size="small" variant="outlined" sx={{ fontSize: "0.65rem", color: "#ce93d8", borderColor: "rgba(206, 147, 216, 0.5)" }} onClick={() => expandUp(node.manager_id)}>
            ⬆️ Show Manager
          </Button>
        )}

        {isRoot && !node.manager_id && viewRootId !== "ROOT" && (
          <Button size="small" variant="outlined" sx={{ fontSize: "0.65rem", color: "#ce93d8", borderColor: "rgba(206, 147, 216, 0.5)" }} onClick={() => expandUp("ROOT")}>
            🏢 Show All Top Level
          </Button>
        )}

        {hasLateralPeers && (
          <Button size="small" variant="contained" sx={{ fontSize: "0.65rem", backgroundColor: "rgba(255,255,255,0.1)" }} onClick={() => toggleTeam(node.id)}>
            {isTeamRevealed ? "Collapse Team" : `👥 Show Team (+${hiddenCount})`}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

// ==========================================
// COMPONENT: The Recursive Tree Node Wrapper
// ==========================================
const OrgNode = (props) => {
  const node = props.employees.find((e) => e.id === props.nodeId);
  if (!node) return null;

  const allChildren = props.employees.filter(e => e.manager_id === node.id);
  const isTeamRevealed = props.revealedTeams.includes(node.id);
  
  const visibleChildren = allChildren.filter(child => isTeamRevealed || props.lineage.has(child.id));

  return (
    <TreeNode label={<EmployeeCard node={node} isRoot={false} {...props} />}>
      {visibleChildren.map((child) => (
        <OrgNode key={child.id} {...props} nodeId={child.id} />
      ))}
    </TreeNode>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
function OrgChartPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [viewRootId, setViewRootId] = useState(null);
  const [revealedTeams, setRevealedTeams] = useState([]); 

  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newManagerId, setNewManagerId] = useState("");

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [meRes, orgRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/org/tree"),
      ]);
      
      const me = meRes.data;
      const allOrg = orgRes.data;

      const adminIds = new Set(allOrg.filter(e => e.role === "admin").map(e => e.id));
      const safeEmployees = allOrg
        .filter(e => e.role !== "admin")
        .map(e => ({
          ...e,
          manager_id: adminIds.has(e.manager_id) ? null : e.manager_id
        }));

      setCurrentUser(me);
      setEmployees(safeEmployees);
      setViewRootId(me.role === "admin" ? "ROOT" : (me.manager_id || me.id));
    } catch (err) {
      setError("Failed to load org chart data");
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

  const lineage = useMemo(() => {
    if (!currentUser) return new Set();
    const path = new Set([currentUser.id]);
    let current = employees.find(e => e.id === currentUser.id);
    while (current && current.manager_id) {
      path.add(current.manager_id);
      current = employees.find(e => e.id === current.manager_id);
    }
    return path;
  }, [currentUser, employees]);

  const toggleTeam = (managerId) => {
    setRevealedTeams(prev => 
      prev.includes(managerId) ? prev.filter(id => id !== managerId) : [...prev, managerId]
    );
  };

  const expandUp = (newRootId) => {
    setViewRootId(newRootId);
    if (newRootId !== "ROOT") {
      setRevealedTeams(prev => prev.includes(newRootId) ? prev : [...prev, newRootId]);
    }
  };

  const handleReset = (resetTransform) => {
    resetTransform();
    setViewRootId(currentUser.role === "admin" ? "ROOT" : (currentUser.manager_id || currentUser.id));
    setRevealedTeams([]); 
  };

  const openReassignDialog = (employee) => {
    setSelectedEmployee(employee);
    setNewManagerId(employee.manager_id || "");
    setError(""); setSuccess(""); setReassignOpen(true);
  };

  const closeReassignDialog = () => {
    setReassignOpen(false); setSelectedEmployee(null); setNewManagerId("");
  };

  const handleReassign = async () => {
    setError(""); setSuccess("");
    try {
      const res = await api.put("/org/reassign", {
        employee_id: selectedEmployee.id,
        new_manager_id: newManagerId === "" ? null : newManagerId,
      });
      setSuccess(res.data.message);
      closeReassignDialog();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reassign manager");
    }
  };

  const renderTree = () => {
    const sharedProps = { employees, currentUser, lineage, revealedTeams, toggleTeam, expandUp, openReassignDialog, viewRootId };

    if (viewRootId === "ROOT") {
      const topLevel = employees.filter(e => !e.manager_id);
      return (
        <Tree lineWidth="2px" lineColor="rgba(255,255,255,0.3)" label={<Typography color="white" fontWeight="bold" sx={{ py: 1, px: 3, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, display: "inline-block", backgroundColor: "#1e2233" }}>Company Top Level</Typography>}>
          {topLevel.map(emp => <OrgNode key={emp.id} nodeId={emp.id} isRoot={false} {...sharedProps} />)}
        </Tree>
      );
    }

    const rootNode = employees.find(e => e.id === viewRootId);
    if (!rootNode) return null;

    const allChildren = employees.filter(e => e.manager_id === rootNode.id);
    const isTeamRevealed = revealedTeams.includes(rootNode.id);
    const visibleChildren = allChildren.filter(c => isTeamRevealed || lineage.has(c.id));

    return (
      <Tree lineWidth="2px" lineColor="rgba(255,255,255,0.3)" label={<EmployeeCard node={rootNode} isRoot={true} {...sharedProps} />}>
        {visibleChildren.map(child => <OrgNode key={child.id} nodeId={child.id} isRoot={false} {...sharedProps} />)}
      </Tree>
    );
  };

  if (!currentUser) return <Typography sx={{ color: "white", textAlign: "center", mt: 5 }}>Loading...</Typography>;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#2b3145", py: 4, display: "flex", flexDirection: "column" }}>
      <Container maxWidth="xl" sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3" fontWeight={800} color="white">
            Organization Chart
          </Typography>
          <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ backgroundColor: "#7a849e" }}>
            Back to Dashboard
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Box sx={{ flexGrow: 1, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, backgroundColor: "#1e2233", overflow: "hidden", position: "relative" }}>
          <TransformWrapper initialScale={1} minScale={0.3} maxScale={2} centerOnInit>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
                  <Button variant="contained" size="small" onClick={() => zoomIn()} sx={{ minWidth: "40px", backgroundColor: "#3f4763" }}>+</Button>
                  <Button variant="contained" size="small" onClick={() => zoomOut()} sx={{ minWidth: "40px", backgroundColor: "#3f4763" }}>-</Button>
                  <Button variant="contained" size="small" onClick={() => handleReset(resetTransform)} sx={{ backgroundColor: "#3f4763", fontWeight: "bold" }}>Reset</Button>
                </Stack>

                <TransformComponent wrapperStyle={{ width: "100%", height: "75vh" }}>
                  <Box sx={{ p: 4, display: "inline-block", minWidth: "100%", textAlign: "center" }}>
                    {renderTree()}
                  </Box>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </Box>
      </Container>

      {/* Admin Reassignment Dialog */}
      <Dialog open={reassignOpen} onClose={closeReassignDialog} PaperProps={{ sx: { backgroundColor: "#2b3145", color: "white" } }}>
        <DialogTitle>Reassign Manager for {selectedEmployee?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: "gray" }}>New Manager</InputLabel>
            <Select value={newManagerId} onChange={(e) => setNewManagerId(e.target.value)} label="New Manager" sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "gray" } }}>
              <MenuItem value=""><em>None (Top Level)</em></MenuItem>
              {employees
                .filter((emp) => emp.id !== selectedEmployee?.id && (emp.role === "manager" || emp.role === "admin"))
                .map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.name} ({emp.role})</MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReassignDialog} sx={{ color: "gray" }}>Cancel</Button>
          <Button onClick={handleReassign} variant="contained" color="primary">Confirm Reassignment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrgChartPage;