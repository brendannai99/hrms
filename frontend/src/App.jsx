import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateEmployeePage from "./pages/CreateEmployeePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ProfilePage from "./pages/ProfilePage";
import ManageEmployeesPage from "./pages/ManageEmployeesPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SalaryManagementPage from "./pages/SalaryManagementPage";
import MySalaryPage from "./pages/MySalaryPage";
import FirstTimePasswordPage from "./pages/FirstTimePasswordPage";
import ApplyLeavePage from "./pages/ApplyLeavePage";
import MyLeavePage from "./pages/MyLeavePage";
import LeaveApprovalPage from "./pages/LeaveApprovalPage";
import PublicHolidaysPage from "./pages/PublicHolidaysPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create-employee" element={<CreateEmployeePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/employees" element={<ManageEmployeesPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/salary-management" element={<SalaryManagementPage />} />
        <Route path="/my-salary" element={<MySalaryPage />} />
        <Route path="/first-time-password" element={<FirstTimePasswordPage />} />

        <Route path="/apply-leave" element={<ApplyLeavePage />} />
        <Route path="/my-leave" element={<MyLeavePage />} />
        <Route path="/leave-approval" element={<LeaveApprovalPage />} />
        <Route path="/public-holidays" element={<PublicHolidaysPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;