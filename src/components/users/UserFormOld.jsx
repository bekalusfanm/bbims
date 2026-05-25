import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { saveUser, updateUser, getUser } from "../../services/userService";
import { getBranches } from "../../services/branchService";
import Select from "../common/select";

const UserForm = ({ userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Staff Member",
    branchId: "",
    hospitalName: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [selectedRole, setSelectedRole] = useState("Staff Member");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load branches
        const branchesData = await getBranches();
        setBranches(branchesData);

        // If editing, load user data
        if (userId) {
          const userData = await getUser(userId);
          setUser(userData);
          setSelectedRole(userData.role || "Staff Member");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
      }
    };

    loadData();
  }, [userId]);

  const validateForm = () => {
    const newErrors = {};
    if (!user.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!user.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!user.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!user.password && !userId) {
      newErrors.password = "Password is required";
    } else if (user.password && user.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!user.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(user.phone)) {
      newErrors.phone = "Phone number is invalid";
    }
    if (!user.role) {
      newErrors.role = "Role is required";
    }
    if (selectedRole === "Hospital Admin" && !user.hospitalName.trim()) {
      newErrors.hospitalName = "Hospital name is required";
    } else if (selectedRole !== "Hospital Admin" && !user.branchId) {
      newErrors.branchId = "Branch is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "role") {
      console.log("Role changed to:", value);
      setSelectedRole(value);
      
      // Force a cleaner state update when role changes
      setUser(prevUser => ({
        ...prevUser,
        role: value,
        branchId: "",
        hospitalName: ""
      }));
    } else {
      setUser(prevUser => ({
        ...prevUser,
        [name]: value
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: ""
        }));
      }
    }
  };

  // Add this function to debug rendering
  const renderDebug = () => {
    console.log("RENDER DEBUG:");
    console.log("- selectedRole:", selectedRole);
    console.log("- user.role:", user.role);
    console.log("- hospitalName:", user.hospitalName);
    console.log("- branchId:", user.branchId);
  };
  
  // Call renderDebug in the component body
  renderDebug();
  
  // Additional useEffect to sync role changes
  useEffect(() => {
    console.log("Role changed in effect:", selectedRole);
    // Force re-render when role changes
  }, [selectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        ...user,
        // If role is Hospital Admin, use hospitalName instead of branchId
        ...(selectedRole === "Hospital Admin" 
          ? { hospitalName: user.hospitalName, branchId: null }
          : { branchId: user.branchId, hospitalName: null }
        )
      };

      if (userId) {
        await updateUser(userId, userData);
        toast.success("User updated successfully");
      } else {
        await saveUser(userData);
        toast.success("User saved successfully");
      }
      navigate("/users");
    } catch (error) {
      console.error("Error saving user:", error);
      if (error.response?.data?.error) {
        setErrors(error.response.data.error);
        toast.error("Please correct the errors in the form");
      } else {
        toast.error("Failed to save user");
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: '', label: 'Select Role' },
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Hospital Admin', label: 'Hospital Admin' },
    { value: 'Staff Member', label: 'Staff Member' }
  ];

  // Create a simple React component for the Hospital Name field
  const HospitalNameField = ({ user, errors, onChange }) => (
    <div className="form-group">
      <label>Hospital Name</label>
      <input
        type="text"
        name="hospitalName"
        className={`form-control ${errors.hospitalName ? "is-invalid" : ""}`}
        value={user.hospitalName || ""}
        onChange={onChange}
        placeholder="Enter hospital name"
      />
      {errors.hospitalName && (
        <div className="invalid-feedback">{errors.hospitalName}</div>
      )}
    </div>
  );

  // Create a simple React component for the Branch field
  const BranchField = ({ user, branches, errors, onChange }) => (
    <div className="form-group">
      <label>Branch</label>
      <select
        name="branchId"
        className={`form-control ${errors.branchId ? "is-invalid" : ""}`}
        value={user.branchId || ""}
        onChange={onChange}
      >
        <option value="">Select Branch</option>
        {branches.map((branch) => (
          <option key={branch._id} value={branch._id}>
            {branch.name}
          </option>
        ))}
      </select>
      {errors.branchId && (
        <div className="invalid-feedback">{errors.branchId}</div>
      )}
    </div>
  );

  // Logic to determine which field to show
  const renderAppropriateField = () => {
    console.log("Current selected role:", selectedRole);
    
    if (selectedRole === "Hospital Admin") {
      console.log("Rendering Hospital Name field");
      return <HospitalNameField user={user} errors={errors} onChange={handleChange} />;
    } else if (selectedRole && selectedRole !== "") {
      console.log("Rendering Branch field");
      return <BranchField user={user} branches={branches} errors={errors} onChange={handleChange} />;
    }
    return null; // Return null if no role is selected
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-header">
              <h3>{userId ? "Edit User" : "Create New User"}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                    value={user.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && (
                    <div className="invalid-feedback">{errors.firstName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                    value={user.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && (
                    <div className="invalid-feedback">{errors.lastName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={user.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    value={user.password}
                    onChange={handleChange}
                    placeholder={userId ? "Leave blank to keep current password" : ""}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    value={user.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    className={`form-control ${errors.role ? "is-invalid" : ""}`}
                    value={selectedRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      console.log("Role selected directly:", newRole);
                      setSelectedRole(newRole);
                      
                      // Update user object
                      setUser(prev => ({
                        ...prev,
                        role: newRole,
                        branchId: "",
                        hospitalName: ""
                      }));
                    }}
                  >
                    <option value="">Select Role</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Hospital Admin">Hospital Admin</option>
                    <option value="Staff Member">Staff Member</option>
                  </select>
                  {errors.role && (
                    <div className="invalid-feedback">{errors.role}</div>
                  )}
                </div>

                {/* Always render both fields but control visibility with inline styles */}
                <div 
                  className="form-group" 
                  style={{ display: selectedRole === "Hospital Admin" ? "block" : "none" }}
                  id="hospitalNameField"
                >
                  <label>Hospital Name</label>
                  <input
                    type="text"
                    name="hospitalName"
                    className={`form-control ${errors.hospitalName ? "is-invalid" : ""}`}
                    value={user.hospitalName || ""}
                    onChange={handleChange}
                    placeholder="Enter hospital name"
                  />
                  {errors.hospitalName && (
                    <div className="invalid-feedback">{errors.hospitalName}</div>
                  )}
                </div>

                <div 
                  className="form-group"
                  style={{ display: selectedRole !== "Hospital Admin" && selectedRole !== "" ? "block" : "none" }}
                  id="branchField"
                >
                  <label>Branch</label>
                  <select
                    name="branchId"
                    className={`form-control ${errors.branchId ? "is-invalid" : ""}`}
                    value={user.branchId || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <div className="invalid-feedback">{errors.branchId}</div>
                  )}
                </div>

                {/* Add a debugging section to see current state */}
                <div className="alert alert-info">
                  <small>
                    <strong>Debug Info:</strong><br/>
                    Selected Role: {selectedRole}<br/>
                    Show Hospital Name: {(selectedRole === "Hospital Admin").toString()}<br/>
                    Show Branch: {(selectedRole !== "Hospital Admin" && selectedRole !== "").toString()}
                  </small>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    value={user.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ml-2"
                    onClick={() => navigate("/users")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm; 