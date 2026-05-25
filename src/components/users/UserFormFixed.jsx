import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { saveUser, updateUser, getUser } from "../../services/userService";
import { getBranches } from "../../services/branchService";

const UserFormFixed = ({ userId }) => {
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
  const [currentRole, setCurrentRole] = useState("Staff Member");
  const [showHospitalName, setShowHospitalName] = useState(false);
  const [showBranch, setShowBranch] = useState(true);

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
          updateDisplayFields(userData.role || "Staff Member");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
      }
    };

    loadData();
  }, [userId]);

  const updateDisplayFields = (role) => {
    console.log("Updating display fields for role:", role);
    setCurrentRole(role);
    setShowHospitalName(role === "Hospital Admin");
    setShowBranch(role !== "Hospital Admin");
  };

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
    }
    if (!user.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!user.role) {
      newErrors.role = "Role is required";
    }
    if (showHospitalName && !user.hospitalName.trim()) {
      newErrors.hospitalName = "Hospital name is required";
    } else if (showBranch && !user.branchId) {
      newErrors.branchId = "Branch is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    console.log("Role changed to:", role);
    
    // Update role in user state
    setUser(prev => ({
      ...prev,
      role: role,
      // Clear fields when switching roles
      branchId: "",
      hospitalName: ""
    }));
    
    // Update which fields to display
    updateDisplayFields(role);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setUser(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        ...user,
        // If Hospital Admin, use hospitalName and set branchId to null
        ...(currentRole === "Hospital Admin" 
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
      toast.error("Failed to save user");
    } finally {
      setLoading(false);
    }
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
                    value={currentRole}
                    onChange={handleRoleChange}
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

                {showHospitalName && (
                  <div className="form-group">
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
                )}

                {showBranch && (
                  <div className="form-group">
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
                )}

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

export default UserFormFixed; 