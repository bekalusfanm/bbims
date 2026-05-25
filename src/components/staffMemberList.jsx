import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getStaffMembers,
  deleteStaffMember,
  getStaffMembersByBranch,
} from "../services/staffMemberService";
import { getBranches } from "../services/branchService";

const StaffMemberList = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "firstName",
    direction: "asc",
  });

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load branches
      const branchesData = await getBranches();
      setBranches(branchesData);

      // Load staff members
      let staffData;
      if (selectedBranch) {
        staffData = await getStaffMembersByBranch(selectedBranch);
      } else {
        staffData = await getStaffMembers();
      }
      setStaffMembers(staffData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await deleteStaffMember(id);
        toast.success("Staff member deleted successfully");
        loadData(); // Reload the list
      } catch (error) {
        console.error("Error deleting staff member:", error);
        toast.error("Failed to delete staff member");
      }
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedStaffMembers = [...staffMembers].sort((a, b) => {
    if (sortConfig.direction === "asc") {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const filteredStaffMembers = sortedStaffMembers.filter((staff) =>
    Object.values(staff).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Staff Members</h2>
        <Link to="/staff-members/new" className="btn btn-primary">
          Add New Staff Member
        </Link>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th onClick={() => handleSort("firstName")} style={{ cursor: "pointer" }}>
                Name
                {sortConfig.key === "firstName" && (
                  <i
                    className={`fas fa-sort-${
                      sortConfig.direction === "asc" ? "up" : "down"
                    } ms-1`}
                  ></i>
                )}
              </th>
              <th onClick={() => handleSort("role")} style={{ cursor: "pointer" }}>
                Role
                {sortConfig.key === "role" && (
                  <i
                    className={`fas fa-sort-${
                      sortConfig.direction === "asc" ? "up" : "down"
                    } ms-1`}
                  ></i>
                )}
              </th>
              <th>Branch</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaffMembers.map((staff) => (
              <tr key={staff._id}>
                <td>
                  <div className="d-flex align-items-center">
                    {staff.photo && (
                      <img
                        src={staff.photo}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px" }}
                      />
                    )}
                    {staff.firstName} {staff.lastName}
                  </div>
                </td>
                <td>{staff.role}</td>
                <td>
                  {branches.find((b) => b._id === staff.branchId)?.name || "N/A"}
                </td>
                <td>
                  <div>{staff.email}</div>
                  <div>{staff.phone}</div>
                </td>
                <td>
                  <div className="btn-group">
                    <Link
                      to={`/staff-members/${staff._id}`}
                      className="btn btn-sm btn-info me-1"
                    >
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link
                      to={`/staff-members/${staff._id}/edit`}
                      className="btn btn-sm btn-warning me-1"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(staff._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStaffMembers.length === 0 && (
        <div className="text-center mt-4">
          <p>No staff members found.</p>
        </div>
      )}
    </div>
  );
};

export default StaffMemberList; 