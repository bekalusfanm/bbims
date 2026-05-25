import React from "react";
import Joi from "joi-browser";
import Form from "../common/form";
import axios from "axios";
import {
  saveBloodRequest,
  getBloodRequestById,
} from "../../services/bloodRequestService";
import { getAllBranches } from "../../services/branchService";
import { toast } from "react-toastify";

class BloodRequestFormSimple extends Form {
  state = {
    data: {
      requester: "",
      branchId: "",
      bloodType: "",
      quantity: "",
      hospitalName: "",
      status: "pending",
      priority: "normal",
      notes: "",
      requiredBy: ""
    },
    branches: [],
    errors: {},
    loading: false
  };

  schema = {
    _id: Joi.string().allow(""),
    requester: Joi.string().required().label("Requester"),
    branchId: Joi.string().required().label("Branch ID"),
    bloodType: Joi.string().required().label("Blood Type"),
    quantity: Joi.number().required().min(1).label("Quantity"),
    hospitalName: Joi.string().required().label("Hospital Name"),
    status: Joi.string().required().label("Status"),
    priority: Joi.string().valid("normal", "urgent", "emergency").label("Priority"),
    notes: Joi.string().allow("").max(500).label("Notes"),
    requiredBy: Joi.date().allow(null, "").label("Required By")
  };

  bloodTypes = ["A", "B", "AB", "O"];
  priorityLevels = [
    { value: "normal", label: "Normal" },
    { value: "urgent", label: "Urgent" },
    { value: "emergency", label: "Emergency" }
  ];

  componentDidMount() {
    this.initialize();
  }

  initialize = async () => {
    try {
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("Current user:", user);
      
      if (user) {
        const data = {...this.state.data};
        // Set requester to user ID - required by backend
        data.requester = user._id || "";
        console.log("Setting initial requester ID:", user._id);
        
        // If hospital admin, prefill hospital name
        if (user.role === "Hospital Admin" && user.hospitalName) {
          data.hospitalName = user.hospitalName;
        }
        
        this.setState({ data });
      }

      // Load branches for dropdown
      try {
        console.log("Fetching branches...");
        const branches = await getAllBranches();
        console.log("Raw branches data:", branches);
        
        // Store the branches in the component state
        this.setState({ branches });
        
        // If we have branches, auto-select the first one
        if (branches && branches.length > 0 && !this.state.data.branchId) {
          const data = {...this.state.data};
          data.branchId = branches[0]._id;
          this.setState({ data });
          console.log("Auto-selected branch:", branches[0]);
        }
      } catch (branchError) {
        console.error("Error loading branches:", branchError);
        // Set empty branches array if there was an error
        this.setState({ branches: [] });
      }

      // If editing, load existing request
      await this.populateBloodRequest();
    } catch (error) {
      console.error("Error in initialization:", error);
      toast.error("Failed to initialize form");
    }
  };

  populateBloodRequest = async () => {
    try {
      const bloodRequestId = this.props.match.params.id;
      if (bloodRequestId === "new") return;

      this.setState({ loading: true });
      const { data: bloodRequest } = await getBloodRequestById(bloodRequestId);
      
      const mappedData = this.mapToViewModel(bloodRequest);
      this.setState({ data: mappedData, loading: false });
    } catch (ex) {
      this.setState({ loading: false });
      if (ex.response && ex.response.status === 404) {
        toast.error("Blood request not found");
        this.props.history.replace("/not-found");
      } else {
        toast.error("Error loading blood request");
      }
    }
  };

  mapToViewModel(bloodRequest) {
    return {
      _id: bloodRequest._id,
      requester: bloodRequest.requester || "",
      branchId: bloodRequest.branchId || "",
      bloodType: bloodRequest.bloodType || "",
      quantity: bloodRequest.quantity || "",
      hospitalName: bloodRequest.hospitalName || "",
      status: bloodRequest.status || "pending",
      priority: bloodRequest.priority || "normal",
      notes: bloodRequest.notes || "",
      requiredBy: bloodRequest.requiredBy ? new Date(bloodRequest.requiredBy).toISOString().substr(0, 10) : ""
    };
  }

  validateForm = () => {
    const { data } = this.state;
    const user = JSON.parse(localStorage.getItem("user"));
    const isHospitalAdmin = user && user.role === "Hospital Admin";
    
    // Make a copy of the data for validation
    const validationData = { ...data };
    
    // Add requester field - backend requires it
    if (user && user._id) {
      validationData.requester = user._id;
    }
    
    // Ensure hospitalName is set for all users
    if (!validationData.hospitalName) {
      // For Hospital Admin, we know their hospital name from their profile
      if (isHospitalAdmin && user.hospitalName) {
        validationData.hospitalName = user.hospitalName;
      } else if (user && user.email) {
        // Generate a hospital name from email if nothing else is available
        const emailParts = user.email.split('@');
        const hospitalDomain = emailParts.length > 1 ? emailParts[1].split('.')[0] : '';
        validationData.hospitalName = hospitalDomain ? 
          hospitalDomain.charAt(0).toUpperCase() + hospitalDomain.slice(1) + " Hospital" : 
          "Default Hospital";
      } else {
        // Final fallback
        validationData.hospitalName = "Default Hospital";
      }
    }

    const { error } = Joi.validate(validationData, this.schema, {
      abortEarly: false,
    });

    if (!error) return null;

    const errors = {};
    for (let item of error.details) errors[item.path[0]] = item.message;
    return errors;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = this.validateForm();
    this.setState({ errors: errors || {} });
    
    if (errors) return;
    
    this.doSubmit();
  };

  doSubmit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const isHospitalAdmin = user && user.role === "Hospital Admin";
      
      // Create a copy of the data for submission
      const submissionData = { ...this.state.data };
      
      // Ensure requester is set
      if (user && user._id) {
        submissionData.requester = user._id;
        console.log("Setting requester ID to:", user._id);
      }
      
      // Ensure hospitalName is set
      if (!submissionData.hospitalName && isHospitalAdmin && user.hospitalName) {
        submissionData.hospitalName = user.hospitalName;
      }
      
      // Ensure branchId is set
      if (!submissionData.branchId) {
        toast.error("Please select a branch");
        return;
      }
      
      // Properly format the requiredBy date or set to null if empty
      if (submissionData.requiredBy && submissionData.requiredBy.trim() !== "") {
        // Ensure it's a valid date object
        submissionData.requiredBy = new Date(submissionData.requiredBy).toISOString();
      } else {
        // If empty, set to null so it won't cause validation errors
        submissionData.requiredBy = null;
      }

      console.log("Submitting blood request with data:", submissionData);
      await saveBloodRequest(submissionData);
      
      // Display appropriate message based on priority
      if (submissionData.priority === "emergency") {
        toast.error("EMERGENCY blood request submitted! The blood bank will be notified immediately.");
      } else if (submissionData.priority === "urgent") {
        toast.warning("Urgent blood request submitted. The blood bank will prioritize this request.");
      } else {
        toast.success("Blood request submitted successfully.");
      }
      
      this.props.history.push("/blood-request");
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        // Check for specific validation errors
        const errorMessage = ex.response.data;
        if (errorMessage.includes("requiredBy")) {
          this.setState({ 
            errors: { 
              ...this.state.errors, 
              requiredBy: "Please enter a valid date in the future or leave blank" 
            } 
          });
          toast.error("Invalid Required By date. Please correct and try again.");
        } else {
          this.setState({ errors: { ...this.state.errors, general: errorMessage } });
          toast.error(errorMessage || "Invalid input. Please check your form.");
        }
      } else {
        console.error("Error submitting blood request:", ex);
        toast.error("An unexpected error occurred. Please try again later.");
      }
    }
  };

  renderLoadingSpinner() {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading request data...</p>
      </div>
    );
  }

  renderBranchSelector(isHospitalAdmin) {
    // Always show the branch selector, it's required by the backend
    const { branches, data } = this.state;
    const hasBranches = branches && branches.length > 0;
    
    // Find the selected branch name in a compatible way
    let selectedBranchName = '';
    if (data.branchId && hasBranches) {
      const selectedBranch = branches.find(b => b._id === data.branchId);
      selectedBranchName = selectedBranch ? selectedBranch.name : data.branchId;
    }
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="branchId">
          Branch {data.branchId && selectedBranchName ? `(Selected: ${selectedBranchName})` : ''}
        </label>
        <select
          name="branchId"
          id="branchId"
          value={data.branchId}
          onChange={this.handleChange}
          className={`form-control ${!hasBranches ? 'is-invalid' : ''}`}
          disabled={!hasBranches}
        >
          {!hasBranches ? (
            <option value="">No branches available</option>
          ) : (
            branches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))
          )}
        </select>
        {!hasBranches && (
          <div className="invalid-feedback">
            No branches available. Please contact an administrator.
          </div>
        )}
      </div>
    );
  }

  renderHospitalNameField(isHospitalAdmin) {
    const { data, errors } = this.state;
    const user = JSON.parse(localStorage.getItem("user"));
    
    // If the user is a hospital admin with a known hospital name, prefill and disable the field
    const isDisabled = isHospitalAdmin && user && user.hospitalName;
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="hospitalName">Hospital Name</label>
        <input
          type="text"
          name="hospitalName"
          id="hospitalName"
          value={data.hospitalName}
          onChange={this.handleChange}
          className={`form-control ${errors.hospitalName ? "is-invalid" : ""}`}
          disabled={isDisabled}
        />
        {errors.hospitalName && (
          <div className="invalid-feedback">{errors.hospitalName}</div>
        )}
      </div>
    );
  }

  renderBloodTypeField() {
    const { data, errors } = this.state;
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="bloodType">Blood Type</label>
        <select
          name="bloodType"
          id="bloodType"
          value={data.bloodType}
          onChange={this.handleChange}
          className={`form-control ${errors.bloodType ? "is-invalid" : ""}`}
        >
          <option value="">Select Blood Type</option>
          {this.bloodTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.bloodType && (
          <div className="invalid-feedback">{errors.bloodType}</div>
        )}
      </div>
    );
  }

  renderQuantityField() {
    const { data, errors } = this.state;
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="quantity">
          Quantity (Units)
        </label>
        <input
          type="number"
          name="quantity"
          id="quantity"
          value={data.quantity}
          onChange={this.handleChange}
          className={`form-control ${errors.quantity ? "is-invalid" : ""}`}
          min="1"
        />
        {errors.quantity && (
          <div className="invalid-feedback">{errors.quantity}</div>
        )}
      </div>
    );
  }

  renderPriorityField() {
    const { data, errors } = this.state;
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="priority">Priority Level</label>
        <select
          name="priority"
          id="priority"
          value={data.priority}
          onChange={this.handleChange}
          className={`form-control ${errors.priority ? "is-invalid" : ""}`}
        >
          {this.priorityLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
        {errors.priority && (
          <div className="invalid-feedback">{errors.priority}</div>
        )}
        {data.priority === "emergency" && (
          <div className="alert alert-danger mt-2">
            <strong>Emergency requests</strong> are for life-threatening situations only and will be prioritized immediately.
          </div>
        )}
        {data.priority === "urgent" && (
          <div className="alert alert-warning mt-2">
            <strong>Urgent requests</strong> will be processed with high priority but after emergency requests.
          </div>
        )}
      </div>
    );
  }

  renderRequiredByField() {
    const { data, errors } = this.state;
    
    // Calculate tomorrow's date for min attribute
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().substr(0, 10);
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="requiredBy">Required By (Optional)</label>
        <input
          type="date"
          name="requiredBy"
          id="requiredBy"
          value={data.requiredBy || ""}
          onChange={this.handleChange}
          className={`form-control ${errors.requiredBy ? "is-invalid" : ""}`}
          min={tomorrowFormatted}
        />
        {errors.requiredBy && (
          <div className="invalid-feedback">{errors.requiredBy}</div>
        )}
        <small className="form-text text-muted">
          Leave blank for immediate need. For scheduled procedures, specify when blood is needed.
        </small>
      </div>
    );
  }

  renderNotesField() {
    const { data, errors } = this.state;
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="notes">Additional Notes (Optional)</label>
        <textarea
          name="notes"
          id="notes"
          value={data.notes}
          onChange={this.handleChange}
          className={`form-control ${errors.notes ? "is-invalid" : ""}`}
          rows="3"
          maxLength="500"
          placeholder="Add any additional information that might be relevant for this request..."
        ></textarea>
        {errors.notes && (
          <div className="invalid-feedback">{errors.notes}</div>
        )}
        <small className="form-text text-muted">
          {500 - (data.notes?.length || 0)} characters remaining
        </small>
      </div>
    );
  }

  renderStatusField(isNew, isHospitalAdmin) {
    // Only show status field for editing if the user is an admin
    if (isNew || isHospitalAdmin) return null;
    
    const { data, errors } = this.state;
    
    return (
      <div className="form-group mb-3">
        <label htmlFor="status">Status</label>
        <select
          name="status"
          id="status"
          value={data.status}
          onChange={this.handleChange}
          className={`form-control ${errors.status ? "is-invalid" : ""}`}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="forwarded">Forwarded</option>
        </select>
        {errors.status && (
          <div className="invalid-feedback">{errors.status}</div>
        )}
      </div>
    );
  }

  renderFormButtons(loading) {
    return (
      <div className="form-group d-flex justify-content-between">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={this.handleCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : this.props.match.params.id === "new" ? (
            "Submit Request"
          ) : (
            "Update Request"
          )}
        </button>
      </div>
    );
  }

  handleCancel = () => {
    this.props.history.push("/blood-request");
  };

  render() {
    const { loading } = this.state;
    
    if (loading) return this.renderLoadingSpinner();
    
    const isNew = this.props.match.params.id === "new";
    const user = JSON.parse(localStorage.getItem("user"));
    const isHospitalAdmin = user && user.role === "Hospital Admin";
    
    return (
      <div className="container">
        <h2>{isNew ? "New Blood Request" : "Edit Blood Request"}</h2>
        
        <form onSubmit={this.handleSubmit}>
          {this.renderBranchSelector(isHospitalAdmin)}
          {this.renderHospitalNameField(isHospitalAdmin)}
          {this.renderBloodTypeField()}
          {this.renderQuantityField()}
          {this.renderPriorityField()}
          {this.renderRequiredByField()}
          {this.renderNotesField()}
          {this.renderStatusField(isNew, isHospitalAdmin)}
          {this.renderFormButtons(loading)}
        </form>
      </div>
    );
  }
}

export default BloodRequestFormSimple; 