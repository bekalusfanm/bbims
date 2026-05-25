import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getStaffMember } from "../services/staffMemberService";
import { getBranches } from "../services/branchService";

const StaffMemberDetails = () => {
  const { id } = useParams();
  const [staffMember, setStaffMember] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load branches
      const branchesData = await getBranches();
      setBranches(branchesData);

      // Load staff member data
      const staffData = await getStaffMember(id);
      setStaffMember(staffData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load staff member details");
    } finally {
      setLoading(false);
    }
  };

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

  if (!staffMember) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Staff member not found.</div>
        <Link to="/staff-members" className="btn btn-primary">
          Back to Staff Members
        </Link>
      </div>
    );
  }

  const branch = branches.find((b) => b._id === staffMember.branchId);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Staff Member Details</h2>
        <div>
          <Link
            to={`/staff-members/${id}/edit`}
            className="btn btn-warning me-2"
          >
            <i className="fas fa-edit me-1"></i> Edit
          </Link>
          <Link to="/staff-members" className="btn btn-secondary">
            <i className="fas fa-arrow-left me-1"></i> Back to List
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              {staffMember.photo ? (
                <img
                  src={staffMember.photo}
                  alt={`${staffMember.firstName} ${staffMember.lastName}`}
                  className="rounded-circle mb-3"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: "150px", height: "150px" }}
                >
                  <i className="fas fa-user fa-4x"></i>
                </div>
              )}
              <h3 className="card-title">
                {staffMember.firstName} {staffMember.lastName}
              </h3>
              <p className="card-text text-muted">{staffMember.role}</p>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-4">Personal Information</h4>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">Email</label>
                  <p>{staffMember.email}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">Phone</label>
                  <p>{staffMember.phone}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">Date of Birth</label>
                  <p>{new Date(staffMember.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">Hire Date</label>
                  <p>{new Date(staffMember.hireDate).toLocaleDateString()}</p>
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label text-muted">Address</label>
                  <p>{staffMember.address || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body">
              <h4 className="card-title mb-4">Work Information</h4>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">Branch</label>
                  <p>{branch ? branch.name : "N/A"}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted">Role</label>
                  <p>{staffMember.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffMemberDetails; 