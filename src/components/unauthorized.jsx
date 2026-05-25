import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  // Get the current user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Determine the appropriate dashboard based on user role
  const getDashboardLink = () => {
    if (!user) return "/login";
    
    switch (user.role) {
      case "Super Admin":
        return "/dashboard";
      case "Admin":
        return "/admin-dashboard";
      case "Staff Member":
        return "/staff-dashboard";
      case "Hospital Admin":
        return "/hospital-dashboard";
      default:
        return "/home";
    }
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 offset-md-2 text-center">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="mb-4">
                <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: "64px" }}></i>
              </div>
              <h2 className="card-title mb-4">Access Denied</h2>
              <p className="card-text mb-4">
                Sorry, you don't have permission to access this page. This area
                is restricted to users with specific roles.
              </p>
              
              {user ? (
                <div className="alert alert-info">
                  <p className="mb-0">
                    You are currently signed in as <strong>{user.username}</strong> with the role of <strong>{user.role}</strong>.
                  </p>
                </div>
              ) : (
                <div className="alert alert-info">
                  <p className="mb-0">
                    You are not currently signed in. Please log in to access protected resources.
                  </p>
                </div>
              )}
              
              <div className="mt-4">
                <Link to={getDashboardLink()} className="btn btn-primary me-3">
                  <i className="fas fa-home me-2"></i>
                  Go to Dashboard
                </Link>
                <Link to="/home" className="btn btn-outline-secondary">
                  <i className="fas fa-arrow-left me-2"></i>
                  Return to Home
                </Link>
              </div>
              
              {!user && (
                <div className="mt-3">
                  <Link to="/login" className="btn btn-success">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 