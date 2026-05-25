// src/App.js
import React, { Component } from "react";
import { Route, Redirect, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import BloodBags from "./components/inventory";
import BloodBagForm from "./components/forms/inventoryForm.jsx";
import Donors from "./components/donors";
import DonorForm from "./components/forms/donorForm";
import DonorDetails from "./components/donorDetails";
import Branches from "./components/branches";
import BranchForm from "./components/forms/branchForm";
import NotFound from "./components/notFound";
import Unauthorized from "./components/unauthorized";
import NavBar from "./components/navBar";
import RegisterForm from "./components/forms/registerForm";
import LoginForm from "./components/loginForm";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import BloodRequests from "./components/bloodRequest";
import BloodRequestFormSimple from "./components/forms/bloodRequestFormSimple";
import Users from "./components/user";
import SuperAdminHome from "./components/superAdminHome";
import SuperAdminBloodRequests from "./components/SuperAdminBloodRequests";
import AdminDashboard from "./components/dashboards/AdminDashboard";
import StaffDashboard from "./components/dashboards/StaffDashboard";
import HospitalDashboard from "./components/HospitalDashboard";
import AuditLogs from "./components/auditLogs";
import { UserProvider } from "./context/userContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import HospitalAdminRoute from "./middleware/hospitalAdmin";
import AdminRoute from "./middleware/admin";
import ProtectedRoute from "./middleware/auth";
import BranchAdminOrSuperAdminRoute from "./middleware/branchAdminOrSuperAdmin";
import Logout from "./components/logout";
import HomePage from "./components/homePage";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { LanguageProvider } from './context/LanguageContext';
import ReportGenerator from './components/reports/ReportGenerator';

// Toast container wrapper that uses theme context
const ThemedToastContainer = () => {
  const { darkMode } = useTheme();
  return (
    <ToastContainer 
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={darkMode ? 'dark' : 'light'}
    />
  );
};

// Main app content wrapper
const AppContent = () => {
  return (
    <React.Fragment>
      <ThemedToastContainer />
      <NavBar />
      <main className="container">
        <Switch>
          <Route path="/users/:id" component={RegisterForm} />
          <Route path="/users" component={Users} />
          <Route path="/login" component={LoginForm} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/settings" component={Settings} />
          <Route path="/logout" component={Logout} />
          <ProtectedRoute path="/inventory/:id" component={BloodBagForm} />
          <ProtectedRoute path="/inventory" component={BloodBags} />
          <ProtectedRoute path="/donors/view/:id" component={DonorDetails} />
          <ProtectedRoute path="/donors/:id" component={DonorForm} />
          <ProtectedRoute path="/donors" component={Donors} />
          <AdminRoute path="/branches/:id" component={BranchForm} />
          <AdminRoute path="/branches" component={Branches} />
          <ProtectedRoute path="/blood-request/:id" component={BloodRequestFormSimple} />
          <ProtectedRoute path="/blood-request" component={BloodRequests} />
          <AdminRoute path="/dashboard" component={SuperAdminHome} />
          <AdminRoute path="/admin-dashboard" component={AdminDashboard} />
          <AdminRoute path="/superadmin-requests" component={SuperAdminBloodRequests} />
          <ProtectedRoute path="/staff-dashboard" component={StaffDashboard} />
          <HospitalAdminRoute path="/hospital-dashboard" component={HospitalDashboard} />
          <AdminRoute path="/audit-logs" component={AuditLogs} />
          <BranchAdminOrSuperAdminRoute path="/reports" component={ReportGenerator} />
          <Route path="/unauthorized" component={Unauthorized} />
          <Route path="/not-found" component={NotFound} />
          <Route path="/home" component={HomePage} />
          <Redirect from="/" exact to="/home" />
          <Redirect to="/not-found" />
        </Switch>
      </main>
    </React.Fragment>
  );
};

class App extends Component {
  componentDidMount() {
    // Apply dark mode on mount
    try {
      const savedSettings = JSON.parse(localStorage.getItem("userSettings"));
      if (savedSettings && savedSettings.darkMode) {
        document.body.classList.add('dark-mode');
      }
    } catch (error) {
      console.error("Error applying dark mode on app mount:", error);
    }
  }

  render() {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <UserProvider>
            <AppContent />
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    );
  }
}

export default App;
