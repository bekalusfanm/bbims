import React from "react";
import Joi from "joi-browser";
import Form from "../common/form";
import { getBranchById, saveBranch } from "../../services/branchService";
import { toast } from "react-toastify";

class BranchForm extends Form {
  state = {
    data: {
      _id: "",
      name: "",
      location: "",
      adminId: "",
      isMainOffice: false,
    },
    errors: {},
    loading: false,
    submitError: null,
  };

  schema = {
    _id: Joi.string().allow(""),
    name: Joi.string().min(3).max(255).required().label("Name"),
    location: Joi.string().min(3).max(255).required().label("Location"),
    adminId: Joi.string().allow("").empty("").label("Admin ID"),
    isMainOffice: Joi.boolean().label("Is Main Office"),
  };

  async componentDidMount() {
    await this.populateBranch();
  }

  async populateBranch() {
    try {
      const branchId = this.props.match.params.id;
      if (branchId === "new") return;

      const branch = await getBranchById(branchId);
      this.setState({ data: this.mapToViewModel(branch) });
    } catch (ex) {
      if (ex.message === "Branch not found") {
        this.props.history.replace("/not-found");
      } else {
        console.error("Error fetching branch:", ex);
      }
    }
  }

  mapToViewModel(branch) {
    return {
      _id: branch._id,
      name: branch.name,
      location: branch.location,
      adminId: branch.adminId,
      isMainOffice: branch.isMainOffice,
    };
  }

  doSubmit = async () => {
    this.setState({ loading: true, submitError: null });
    
    try {
      const { data } = this.state;
      
      // Create a copy of the data
      let branchData = { ...data };
      
      // If adminId is empty, remove it completely from the request
      if (!branchData.adminId) {
        delete branchData.adminId;
      }
      
      console.log("Submitting branch data:", branchData);
      
      let result;
      if (branchData._id) {
        // Update existing branch
        result = await saveBranch(branchData);
      } else {
        // Create new branch without _id
        const { _id, ...dataWithoutId } = branchData;
        result = await saveBranch(dataWithoutId);
      }
      
      // Only redirect if we got a successful response
      if (result) {
        console.log("Branch saved successfully, redirecting to branches list");
        this.props.history.push("/branches");
      } else {
        // If result is null or undefined, there was an error that was already handled by saveBranch
        console.error("Failed to save branch - no result returned");
        this.setState({ 
          submitError: "Branch operation failed. Please check console for details." 
        });
      }
    } catch (error) {
      console.error("Unhandled error saving branch:", error);
      
      // Get a meaningful error message from the error response if available
      const errorMessage = 
        (error.response && error.response.data) || 
        error.message || 
        "An unexpected error occurred while saving the branch";
      
      // Don't show toast here, it's already shown in the service
      this.setState({ submitError: errorMessage });
    } finally {
      this.setState({ loading: false });
    }
  };

  renderCheckbox(name, label) {
    const { data, errors } = this.state;
    const isChecked = data[name];
    const error = errors[name];

    const toggleCheckbox = () => {
      const newData = { ...data, [name]: !isChecked };
      this.setState({ data: newData });
    };

    return (
      <div className="form-group">
        <label htmlFor={name}>{label}</label>
        <input
          type="checkbox"
          name={name}
          id={name}
          checked={isChecked}
          onChange={toggleCheckbox}
          className={error ? "is-invalid" : ""}
        />
        {error && <div className="invalid-feedback">{error}</div>}
      </div>
    );
  }

  render() {
    const { loading, submitError } = this.state;
    return (
      <div>
        <h1>{this.state.data._id ? "Update Branch" : "Create Branch"}</h1>
        
        {submitError && (
          <div className="alert alert-danger" role="alert">
            {submitError}
          </div>
        )}
        
        <form onSubmit={this.handleSubmit}>
          {this.renderInput("name", "Name")}
          {this.renderInput("location", "Location")}
          {this.renderInput("adminId", "Admin ID (Optional)")}
          {this.renderCheckbox("isMainOffice", "Is Main Office")}
          {this.renderButton(
            this.state.data._id 
              ? (loading ? "Updating..." : "Update") 
              : (loading ? "Creating..." : "Create"),
            loading
          )}
        </form>
      </div>
    );
  }
}

export default BranchForm;
