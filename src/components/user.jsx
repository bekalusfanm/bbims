import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Table from "./common/table";
import styled from "styled-components";
import userService from "../services/userService";
import http from "../services/httpService";
import { apiUrl } from "../config.json";

const UsersContainer = styled.div`
  padding: 20px;
  background-color: ${props => props.isDarkMode ? '#2d3436' : '#fff'};
  color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const UsersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
  }
  
  .btn-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    
    &:hover {
      background-color: var(--primary-color-dark);
      border-color: var(--primary-color-dark);
    }
  }
`;

const FilterBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px;
  background-color: ${props => props.isDarkMode ? '#404b69' : '#f8f9fa'};
  border-radius: 5px;
  
  select {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    background-color: ${props => props.isDarkMode ? '#2d3436' : '#fff'};
    color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
  }
`;

const RoleBadge = styled.span`
  font-size: 0.85rem;
  padding: 6px 10px;
  border-radius: 4px;
  color: white;
  background-color: ${props => {
    switch (props.role) {
      case 'Super Admin': return '#e74c3c';
      case 'Admin': return '#3498db';
      case 'Hospital Admin': return '#2ecc71';
      case 'Staff Member': return '#f39c12';
      default: return '#95a5a6';
    }
  }};
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 0.25rem solid rgba(0, 0, 0, 0.1);
  border-right-color: var(--primary-color);
  border-radius: 50%;
  animation: spinner 0.75s linear infinite;
  
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Define the valid system roles to use as a fallback
const SYSTEM_ROLES = ["Super Admin", "Admin", "Hospital Admin", "Staff Member"];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sortColumn, setSortColumn] = useState({ path: "name", order: "asc" });
  const [availableRoles, setAvailableRoles] = useState([]);
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, selectedRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      console.log("Fetched users:", data);
      setUsers(data);
      
      // Get available roles from the backend if possible
      try {
        const response = await http.get(`${apiUrl}/users/roles`);
        console.log("Roles API response:", response);
        
        if (response.data && Array.isArray(response.data)) {
          console.log("Fetched roles from API:", response.data);
          setAvailableRoles(response.data);
        } else {
          // Fallback: use system defined roles
          console.log("Using system defined roles:", SYSTEM_ROLES);
          setAvailableRoles(SYSTEM_ROLES);
        }
      } catch (error) {
        console.warn("Error fetching roles from API:", error);
        // Fallback: use system defined roles
        console.log("Using system defined roles:", SYSTEM_ROLES);
        setAvailableRoles(SYSTEM_ROLES);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const originalUsers = [...users];
    
    // Optimistic update - remove user from UI first
    setUsers(users.filter(u => u._id !== user._id));

    try {
      await userService.deleteUser(user._id);
      // Success toast is handled in the service
    } catch (error) {
      // Revert to original users list if deletion fails
      setUsers(originalUsers);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (selectedRole !== "all") {
      filtered = filtered.filter(user => user.role === selectedRole);
    }
    
    setFilteredUsers(filtered);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const handleSort = (sortColumn) => {
    setSortColumn(sortColumn);
  };

  const sortUsers = (users, column) => {
    const sorted = [...users].sort((a, b) => {
      const aValue = a[column.path];
      const bValue = b[column.path];
      
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return column.order === "asc" ? comparison : -comparison;
    });
    
    return sorted;
  };

  const columns = [
    {
      path: "name",
      label: "Name",
      content: (user) => <Link to={`/users/${user._id}`}>{user.name}</Link>
    },
    { path: "email", label: "Email" },
    { 
      path: "role", 
      label: "Role",
      content: (user) => <RoleBadge role={user.role}>{user.role}</RoleBadge>
    },
    { path: "contactDetails.phone", label: "Phone" },
    {
      key: "delete",
      content: (user) => (
        currentUser && (currentUser.role === "Super Admin" || 
          (currentUser.role === "Admin" && user.role === "Staff Member" && user.branchId === currentUser.branchId)) ? (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(user)}
          >
            Delete
          </button>
        ) : null
      )
    }
  ];

  // Apply sorting
  const sortedUsers = sortUsers(filteredUsers, sortColumn);

  return (
    <UsersContainer isDarkMode={isDarkMode}>
      <UsersHeader isDarkMode={isDarkMode}>
        <h2>Users</h2>
        {currentUser && (currentUser.role === "Super Admin" || (currentUser.role === "Admin" && currentUser.branchId)) && (
          <Link to="/users/new" className="btn btn-primary">
            New User
          </Link>
        )}
      </UsersHeader>
      
      {currentUser && currentUser.role === "Admin" && (
        <div className="alert alert-info mb-3">
          <i className="fas fa-info-circle mr-2"></i>
          <strong>Note:</strong> As a Branch Admin, you can create Staff Member accounts for your branch. 
          These staff members will be associated with your branch automatically.
      </div>
      )}
      
      <FilterBar isDarkMode={isDarkMode}>
        <div>
          <label htmlFor="roleFilter" className="me-2">Filter by Role:</label>
          <select 
            id="roleFilter" 
            value={selectedRole} 
            onChange={handleRoleChange}
            className="form-select"
          >
            <option value="all">All Roles</option>
            {SYSTEM_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="badge bg-secondary">
            {sortedUsers.length} {sortedUsers.length === 1 ? "User" : "Users"}
          </span>
      </div>
      </FilterBar>
      
      {isLoading ? (
        <div className="text-center mt-5">
          <LoadingSpinner />
          <p className="mt-2">Loading users...</p>
    </div>
      ) : sortedUsers.length === 0 ? (
        <div className="alert alert-info">No users found matching the selected criteria.</div>
      ) : (
        <Table
          columns={columns}
          data={sortedUsers}
          sortColumn={sortColumn}
          onSort={handleSort}
        />
      )}
    </UsersContainer>
  );
};

export default Users;
