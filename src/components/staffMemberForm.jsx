import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  saveStaffMember,
  updateStaffMember,
  uploadStaffPhoto,
  getStaffMember,
} from "../services/staffMemberService";
import { getBranches } from "../services/branchService";

const StaffMemberForm = ({ staffMemberId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [staffMember, setStaffMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Staff Member",
    branchId: "",
    address: "",
    dateOfBirth: "",
    hireDate: "",
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load branches
        const branchesData = await getBranches();
        setBranches(branchesData);

        // If editing, load staff member data
        if (staffMemberId) {
          const staffData = await getStaffMember(staffMemberId);
          setStaffMember(staffData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
      }
    };

    loadData();
  }, [staffMemberId]);

  const validateForm = () => {
    const newErrors = {};
    if (!staffMember.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!staffMember.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!staffMember.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(staffMember.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!staffMember.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(staffMember.phone)) {
      newErrors.phone = "Phone number is invalid";
    }
    if (!staffMember.branchId) {
      newErrors.branchId = "Branch is required";
    }
    if (!staffMember.role) {
      newErrors.role = "Role is required";
    }
    if (!staffMember.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(staffMember.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }
    if (!staffMember.hireDate) {
      newErrors.hireDate = "Hire date is required";
    } else {
      const hireDate = new Date(staffMember.hireDate);
      const today = new Date();
      if (hireDate > today) {
        newErrors.hireDate = "Hire date cannot be in the future";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStaffMember((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setPhotoFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setStaffMember(prev => ({
        ...prev,
        photo: previewUrl
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let photoUrl = staffMember.photo;
      
      // Upload photo if a new one is selected
      if (photoFile) {
        photoUrl = await uploadStaffPhoto(photoFile);
      }

      const staffMemberData = {
        ...staffMember,
        photo: photoUrl
      };

      if (staffMemberId) {
        await updateStaffMember(staffMemberId, staffMemberData);
        toast.success("Staff member updated successfully");
      } else {
        await saveStaffMember(staffMemberData);
        toast.success("Staff member saved successfully");
      }
      navigate("/staff-members");
    } catch (error) {
      console.error("Error saving staff member:", error);
      if (error.response?.data?.error) {
        // Handle validation errors from the server
        setErrors(error.response.data.error);
        toast.error("Please correct the errors in the form");
      } else {
        toast.error("Failed to save staff member");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>{staffMemberId ? "Edit Staff Member" : "Add New Staff Member"}</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">First Name</label>
            <input
              type="text"
              className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
              name="firstName"
              value={staffMember.firstName}
              onChange={handleChange}
            />
            {errors.firstName && (
              <div className="invalid-feedback">{errors.firstName}</div>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
              name="lastName"
              value={staffMember.lastName}
              onChange={handleChange}
            />
            {errors.lastName && (
              <div className="invalid-feedback">{errors.lastName}</div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              name="email"
              value={staffMember.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              name="phone"
              value={staffMember.phone}
              onChange={handleChange}
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Branch</label>
            <select
              className={`form-select ${errors.branchId ? "is-invalid" : ""}`}
              name="branchId"
              value={staffMember.branchId}
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
          <div className="col-md-6 mb-3">
            <label className="form-label">Role</label>
            <select
              className={`form-select ${errors.role ? "is-invalid" : ""}`}
              name="role"
              value={staffMember.role}
              onChange={handleChange}
            >
              <option value="Staff Member">Staff Member</option>
              <option value="Nurse">Nurse</option>
              <option value="Doctor">Doctor</option>
              <option value="Technician">Technician</option>
            </select>
            {errors.role && (
              <div className="invalid-feedback">{errors.role}</div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className={`form-control ${errors.dateOfBirth ? "is-invalid" : ""}`}
              name="dateOfBirth"
              value={staffMember.dateOfBirth}
              onChange={handleChange}
            />
            {errors.dateOfBirth && (
              <div className="invalid-feedback">{errors.dateOfBirth}</div>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Hire Date</label>
            <input
              type="date"
              className={`form-control ${errors.hireDate ? "is-invalid" : ""}`}
              name="hireDate"
              value={staffMember.hireDate}
              onChange={handleChange}
            />
            {errors.hireDate && (
              <div className="invalid-feedback">{errors.hireDate}</div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Address</label>
          <textarea
            className="form-control"
            name="address"
            value={staffMember.address}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Photo</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {staffMember.photo && (
            <div className="mt-2">
              <img
                src={staffMember.photo}
                alt="Staff member"
                style={{ maxWidth: "200px", maxHeight: "200px" }}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={loading}
          >
            {loading ? "Saving..." : staffMemberId ? "Update" : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/staff-members")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffMemberForm; 