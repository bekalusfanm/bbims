import React, { Component } from "react";
import { toast } from "react-toastify";
import { saveUser, updateUser, getUser } from "../../services/userService";
import { getBranches } from "../../services/branchService";

class UserFormSimple extends Component {
  state = {
    data: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "Staff Member",
      branchId: "",
      hospitalName: "",
      phone: "",
      address: "",
    },
    branches: [],
    errors: {},
    loading: false,
    showHospitalName: false,
    showBranch: true
  };

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    try {
      // Load branches
      const branches = await getBranches();
      this.setState({ branches });

      // If editing, load user data
      if (this.props.userId) {
        const userData = await getUser(this.props.userId);
        this.setState({ data: userData });
        this.updateDisplayFields(userData.role || "Staff Member");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load form data");
    }
  };

  updateDisplayFields = (role) => {
    console.log("Updating display fields for role:", role);
    this.setState({
      showHospitalName: role === "Hospital Admin",
      showBranch: role !== "Hospital Admin"
    });
  };

  validateForm = () => {
    const { data } = this.state;
    const errors = {};
    
    if (!data.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!data.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!data.email.trim()) {
      errors.email = "Email is required";
    }
    if (!data.password && !this.props.userId) {
      errors.password = "Password is required";
    }
    if (!data.phone.trim()) {
      errors.phone = "Phone number is required";
    }
    if (!data.role) {
      errors.role = "Role is required";
    }
    if (this.state.showHospitalName && !data.hospitalName.trim()) {
      errors.hospitalName = "Hospital name is required";
    } else if (this.state.showBranch && !data.branchId) {
      errors.branchId = "Branch is required";
    }
    
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleRoleChange = (e) => {
    const role = e.target.value;
    console.log("Role changed to:", role);
    
    // Update role in data
    const data = { ...this.state.data };
    data.role = role;
    data.branchId = "";
    data.hospitalName = "";
    this.setState({ data });
    
    // Update which fields to display
    this.updateDisplayFields(role);
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the data
    const data = { ...this.state.data };
    data[name] = value;
    this.setState({ data });

    // Clear error when user starts typing
    if (this.state.errors[name]) {
      const errors = { ...this.state.errors };
      delete errors[name];
      this.setState({ errors });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    if (!this.validateForm()) return;

    this.setState({ loading: true });
    try {
      const userData = { ...this.state.data };
      
      // Adjust branchId and hospitalName based on role
      if (userData.role === "Hospital Admin") {
        userData.branchId = null;
      } else {
        userData.hospitalName = null;
      }

      if (this.props.userId) {
        await updateUser(this.props.userId, userData);
        toast.success("User updated successfully");
      } else {
        await saveUser(userData);
        toast.success("User saved successfully");
      }
      window.location = "/users";
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { data, errors, branches, loading, showHospitalName, showBranch } = this.state;
    const { userId } = this.props;

    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="card">
              <div className="card-header">
                <h3>{userId ? "Edit User" : "Create New User"}</h3>
              </div>
              <div className="card-body">
                <form onSubmit={this.handleSubmit}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      className={"form-control " + (errors.firstName ? "is-invalid" : "")}
                      value={data.firstName}
                      onChange={this.handleChange}
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
                      className={"form-control " + (errors.lastName ? "is-invalid" : "")}
                      value={data.lastName}
                      onChange={this.handleChange}
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
                      className={"form-control " + (errors.email ? "is-invalid" : "")}
                      value={data.email}
                      onChange={this.handleChange}
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
                      className={"form-control " + (errors.password ? "is-invalid" : "")}
                      value={data.password}
                      onChange={this.handleChange}
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
                      className={"form-control " + (errors.phone ? "is-invalid" : "")}
                      value={data.phone}
                      onChange={this.handleChange}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      name="role"
                      className={"form-control " + (errors.role ? "is-invalid" : "")}
                      value={data.role}
                      onChange={this.handleRoleChange}
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
                    <div className="form-group" style={{backgroundColor: 'lightyellow', padding: '10px'}}>
                      <label>Hospital Name</label>
                      <input
                        type="text"
                        name="hospitalName"
                        className={"form-control " + (errors.hospitalName ? "is-invalid" : "")}
                        value={data.hospitalName || ""}
                        onChange={this.handleChange}
                        placeholder="Enter hospital name"
                      />
                      {errors.hospitalName && (
                        <div className="invalid-feedback">{errors.hospitalName}</div>
                      )}
                    </div>
                  )}

                  {showBranch && (
                    <div className="form-group" style={{backgroundColor: 'lightgray', padding: '10px'}}>
                      <label>Branch</label>
                      <select
                        name="branchId"
                        className={"form-control " + (errors.branchId ? "is-invalid" : "")}
                        value={data.branchId || ""}
                        onChange={this.handleChange}
                      >
                        <option value="">Select Branch</option>
                        {branches.map(function(branch) {
                          return (
                            <option key={branch._id} value={branch._id}>
                              {branch.name}
                            </option>
                          );
                        })}
                      </select>
                      {errors.branchId && (
                        <div className="invalid-feedback">{errors.branchId}</div>
                      )}
                    </div>
                  )}

                  <div style={{backgroundColor: '#f8f9fa', padding: '10px', margin: '10px 0'}}>
                    <strong>Current State:</strong><br/>
                    Role: {data.role}<br/>
                    Show Hospital Name: {String(showHospitalName)}<br/>
                    Show Branch: {String(showBranch)}
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      className="form-control"
                      value={data.address}
                      onChange={this.handleChange}
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
                      onClick={function() { window.location = "/users"; }}
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
  }
}

export default UserFormSimple; 