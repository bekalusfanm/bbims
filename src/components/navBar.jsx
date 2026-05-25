import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "../styles/navBar.css";
import { useTheme } from '../context/ThemeContext';

const NavBar = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeLink, setActiveLink] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

  const handleClick = (link) => {
    setActiveLink(link);
    setTimeout(() => {
      setActiveLink(null);
    }, 300);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e) => {
    e.preventDefault();
    setShowDropdown(!showDropdown);
  };

  const renderNavLink = (to, label, icon = null) => (
    <li className="nav-item">
      <NavLink
        className={`nav-link ${activeLink === to ? "fade-in" : ""}`}
        to={to}
        onClick={() => handleClick(to)}
      >
        {icon && <i className={`${icon} me-2`}></i>}
        {label}
      </NavLink>
    </li>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <div className="d-flex align-items-center">
            <img src="/New Project.png" alt="Blood Bank Logo" className="logo" />
            <div className="ms-2">
              <span className="nbbe-text">NBBE</span>
              <div className="logo-subtitle">National Blood Bank Exchange</div>
            </div>
          </div>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {renderNavLink("/home", "Home", "fas fa-home")}
            
            {user && user.role === "Super Admin" && 
              renderNavLink("/dashboard", "Dashboard", "fas fa-chart-line")}
            
            {user && user.role === "Admin" && 
              renderNavLink("/admin-dashboard", "Dashboard", "fas fa-chart-line")}
            
            {user && user.role === "Staff Member" && 
              renderNavLink("/staff-dashboard", "Dashboard", "fas fa-chart-line")}
            
            {user && user.role === "Hospital Admin" && 
              renderNavLink("/hospital-dashboard", "Dashboard", "fas fa-chart-line")}
            
            {user &&
              ["Admin", "Super Admin", "Staff Member"].includes(user.role) &&
              renderNavLink("/inventory", "Inventory", "fas fa-box")}
            
            {user &&
              ["Admin", "Super Admin", "Staff Member"].includes(user.role) &&
              renderNavLink("/donors", "Donors", "fas fa-user-friends")}
            
            {user &&
              user.role === "Super Admin" &&
              renderNavLink("/branches", "Branches", "fas fa-building")}
            
            {user &&
              ["Admin", "Super Admin"].includes(user.role) &&
              renderNavLink("/reports", "Reports", "fas fa-file-alt")}
            
            {user &&
              ["Admin", "Super Admin"].includes(user.role) &&
              renderNavLink("/users", "Users", "fas fa-users")}
            
            {user &&
              ["Admin", "Super Admin", "Hospital Admin"].includes(user.role) &&
              renderNavLink("/blood-request", "Requests", "fas fa-heartbeat")}
            
            {user && user.role === "Hospital Admin" &&
              renderNavLink("/blood-request/new", "New Request", "fas fa-plus-circle")}
            
            {user && user.role === "Super Admin" && 
              renderNavLink("/audit-logs", "Logs", "fas fa-clipboard-list")}
            
            {user ? (
              <li className="nav-item profile-dropdown" ref={dropdownRef}>
                <a 
                  href="#" 
                  className="nav-link profile-link" 
                  onClick={toggleDropdown}
                  aria-expanded={showDropdown}
                >
                  <div className="profile-container">
                    <img
                      src={user.profilePicture || "/default-profile.png"}
                      alt="Profile"
                      className="profile-picture"
                    />
                    <span className="profile-name">{user.username}</span>
                    <i className={`fas fa-chevron-down ms-2 ${showDropdown ? 'fa-rotate-180' : ''}`} style={{ transition: 'transform 0.3s' }}></i>
                  </div>
                </a>
                {showDropdown && (
                  <div className="profile-dropdown-menu">
                    <div className="p-3 text-center border-bottom">
                      <img
                        src={user.profilePicture || "/default-profile.png"}
                        alt="Profile"
                        className="profile-picture mb-2"
                        style={{ width: '60px', height: '60px' }}
                      />
                      <h6 className="mb-0">{user.username}</h6>
                      <small className="text-muted">{user.role}</small>
                      {user.role === "Hospital Admin" && user.hospitalName && (
                        <small className="d-block mt-1">{user.hospitalName}</small>
                      )}
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <i className="fas fa-user-circle"></i> My Profile
                    </Link>
                    
                    <Link 
                      to="/settings" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <i className="fas fa-cog"></i> Settings
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link 
                      to="/logout" 
                      className="dropdown-item text-danger"
                      onClick={() => setShowDropdown(false)}
                    >
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </Link>
                  </div>
                )}
              </li>
            ) : (
              renderNavLink("/login", "Login", "fas fa-sign-in-alt")
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
