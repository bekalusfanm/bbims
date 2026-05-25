import React from "react";
import Joi from "joi-browser";
import Form from "../common/form";
import {
  saveBloodRequest,
  getBloodRequestById,
} from "../../services/bloodRequestService";
import { getBranches } from "../../services/branchService";
import { toast } from "react-toastify";

class BloodRequestForm extends Form {
  state = {
    data: {
      requester: "",
      branchId: "",
      bloodType: "",
      quantity: "",
      hospitalName: "",
      status: "pending"
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
    status: Joi.string().required().label("Status")
  };

  bloodTypes = ["A", "B", "AB", "O"];

  async componentDidMount() {
    try {
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (user) {
        const data = {...this.state.data};
        // Set requester to user ID for tracking
        data.requester = user._id || "";
        
        // If hospital admin, prefill hospital name
        if (user.role === "Hospital Admin" && user.hospitalName) {
          data.hospitalName = user.hospitalName;
        }
        
        this.setState({ data });
      }

      // Load branches for dropdown
      const branches = await getBranches();
      this.setState({ branches });

      // If editing, load existing request
    await this.populateBloodRequest();
    } catch (error) {
      console.error("Error in componentDidMount:", error);
      toast.error("Failed to initialize form");
    }
  }

  async populateBloodRequest() {
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
  }

  mapToViewModel(bloodRequest) {
    return {
      _id: bloodRequest._id,
      requester: bloodRequest.requester || "",
      branchId: bloodRequest.branchId || "",
      bloodType: bloodRequest.bloodType || "",
      quantity: bloodRequest.quantity || "",
      hospitalName: bloodRequest.hospitalName || "",
      status: bloodRequest.status || "pending"
    };
  }

  doSubmit = async () => {
    try {
      this.setState({ loading: true });
    const { data } = this.state;

    await saveBloodRequest(data);
      
      toast.success("Blood request submitted successfully");
    this.props.history.push("/blood-request");
    } catch (error) {
      this.setState({ loading: false });
      if (error.response && error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("Failed to submit blood request");
      }
      console.error("Error submitting blood request:", error);
    }
  };

  render() {
    const { loading, branches } = this.state;
    const isNew = !this.state.data._id;
    const user = JSON.parse(localStorage.getItem("user"));
    const isHospitalAdmin = user && user.role === "Hospital Admin";

    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="card">
              <div className="card-header">
                <h3>{isNew ? "New Blood Request" : "Edit Blood Request"}</h3>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading request data...</p>
                  </div>
                ) : (
                  <form onSubmit={this.handleSubmit}>
                    {/* Only show branch selector to non-hospital admins */}
                    {!isHospitalAdmin && (
                      <div className="form-group mb-3">
                        <label htmlFor="branchId">Branch</label>
        <select
                          name="branchId"
                          id="branchId"
                          value={this.state.data.branchId}
          onChange={this.handleChange}
                          className={`form-control ${this.state.errors.branchId ? "is-invalid" : ""}`}
                        >
                          <option value="">Select Branch</option>
                          {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name}
            </option>
          ))}
        </select>
                        {this.state.errors.branchId && (
                          <div className="invalid-feedback">{this.state.errors.branchId}</div>
        )}
      </div>
                    )}

                    <div className="form-group mb-3">
                      <label htmlFor="hospitalName">Hospital Name</label>
                      <input
                        type="text"
                        className={`form-control ${this.state.errors.hospitalName ? "is-invalid" : ""}`}
                        id="hospitalName"
                        name="hospitalName"
                        value={this.state.data.hospitalName}
                        onChange={this.handleChange}
                        disabled={isHospitalAdmin} // Disabled for hospital admins since it's prefilled
                      />
                      {this.state.errors.hospitalName && (
                        <div className="invalid-feedback">{this.state.errors.hospitalName}</div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="bloodType">Blood Type</label>
                          <select
                            name="bloodType"
                            id="bloodType"
                            value={this.state.data.bloodType}
                            onChange={this.handleChange}
                            className={`form-control ${this.state.errors.bloodType ? "is-invalid" : ""}`}
                          >
                            <option value="">Select Blood Type</option>
                            {this.bloodTypes.map(type => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          {this.state.errors.bloodType && (
                            <div className="invalid-feedback">{this.state.errors.bloodType}</div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="quantity">Quantity</label>
        <input
                            type="number"
                            className={`form-control ${this.state.errors.quantity ? "is-invalid" : ""}`}
                            id="quantity"
                            name="quantity"
                            value={this.state.data.quantity}
          onChange={this.handleChange}
                            min="1"
                          />
                          {this.state.errors.quantity && (
                            <div className="invalid-feedback">{this.state.errors.quantity}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status field - visible only when editing */}
                    {!isNew && !isHospitalAdmin && (
                      <div className="form-group mb-3">
                        <label htmlFor="status">Status</label>
                        <select
                          name="status"
                          id="status"
                          value={this.state.data.status}
                          onChange={this.handleChange}
                          className={`form-control ${this.state.errors.status ? "is-invalid" : ""}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="completed">Completed</option>
                        </select>
                        {this.state.errors.status && (
                          <div className="invalid-feedback">{this.state.errors.status}</div>
        )}
      </div>
                    )}

                    <div className="form-group mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <React.Fragment>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </React.Fragment>
                        ) : (
                          "Submit Request"
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary ms-2" 
                        onClick={() => this.props.history.push("/blood-request")}
                      >
                        Cancel
                      </button>
                    </div>
        </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BloodRequestForm;
