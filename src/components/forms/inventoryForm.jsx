import React from "react";
import Joi from "joi-browser";
import Form from "../common/form";
import { getBloodBag, saveBloodBag } from "../../services/inventoryService";
import { getDonors } from "../../services/donorService";
import { toast } from "react-toastify";

class BloodBagForm extends Form {
  state = {
    data: {
      bloodType: "",
      bloodCollector: "",
      collectionDate: "",
      expiryDate: "",
      branchId: "",
      donorId: "",
      locationCollected: "",
    },
    donors: [],
    errors: {},
    loading: false,
    isSubmitting: false,
  };

  schema = {
    _id: Joi.string().allow(""),
    bloodType: Joi.string().required().label("Blood Type"),
    bloodCollector: Joi.string().required().label("Blood Collector"),
    collectionDate: Joi.date().required().label("Collection Date"),
    expiryDate: Joi.date().required().label("Expiry Date"),
    branchId: Joi.string().required().label("Branch ID"),
    donorId: Joi.string().required().label("Donor ID"),
    locationCollected: Joi.string().required().label("Location Collected"),
  };

  async componentDidMount() {
    this.setState({ loading: true });
    try {
      // Get the current user and set the branch ID
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        toast.error("Please log in to access this page");
        this.props.history.push("/login");
        return;
      }

      if (!user.branchId) {
        toast.error("You must be assigned to a branch to register blood bags");
        this.props.history.push("/");
        return;
      }

      // Set the branch ID from the logged-in user's data
      const data = { ...this.state.data };
      data.branchId = user.branchId;
      
      // Fetch donors for dropdown
      const donors = await getDonors();
      
      if (!donors || donors.length === 0) {
        toast.warning("No donors found. Please register a donor first.");
      }
      
      this.setState({ donors, data });
      
    await this.populateBloodBag();
    } catch (error) {
      console.error("Error initializing form:", error);
      toast.error("Failed to load data. Please try again.");
    } finally {
      this.setState({ loading: false });
    }
  }

  async populateBloodBag() {
    try {
      const bloodBagId = this.props.match.params.id;
      if (bloodBagId === "new") return;

      const { data: bloodBag } = await getBloodBag(bloodBagId);
      this.setState({ data: this.mapToViewModel(bloodBag) });
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        toast.error("Blood bag not found");
        this.props.history.replace("/not-found");
      } else {
        console.error("Error fetching blood bag:", ex);
        toast.error("Error loading blood bag");
      }
    }
  }

  mapToViewModel(bloodBag) {
    return {
      _id: bloodBag._id,
      bloodType: bloodBag.bloodType,
      bloodCollector: bloodBag.bloodCollector,
      collectionDate: new Date(bloodBag.collectionDate)
        .toISOString()
        .slice(0, 10),
      expiryDate: new Date(bloodBag.expiryDate).toISOString().slice(0, 10),
      branchId: bloodBag.branchId,
      donorId: bloodBag.donorId,
      locationCollected: bloodBag.locationCollected,
    };
  }

  calculateExpiryDate = (collectionDate) => {
    if (!collectionDate) return "";
    const date = new Date(collectionDate);
    // Add 42 days (6 weeks) to the collection date
    date.setDate(date.getDate() + 42);
    return date.toISOString().slice(0, 10);
  };

  handleDateChange = ({ currentTarget: input }) => {
    const data = { ...this.state.data };
    data[input.name] = input.value;
    
    // Auto-calculate expiry date when collection date changes
    if (input.name === "collectionDate") {
      data.expiryDate = this.calculateExpiryDate(input.value);
    }
    
    this.setState({ data });
  };

  doSubmit = async () => {
    this.setState({ isSubmitting: true });
    try {
      const { data } = this.state;
      
      // Get user info
      const user = JSON.parse(localStorage.getItem("user")) || {};
      
      // Format dates correctly
      let formData = {
        ...data,
        branchId: data.branchId || (user && user.branchId ? user.branchId : '')
      };
      
      // Format collection date
      if (formData.collectionDate) {
        const collDate = new Date(formData.collectionDate);
        formData.collectionDate = collDate.toISOString();
      }
      
      // Format expiry date
      if (formData.expiryDate) {
        const expDate = new Date(formData.expiryDate);
        formData.expiryDate = expDate.toISOString();
      }
      
      // Add default quantity
      formData.quantity = 1;
      
      // Basic validation
      if (!formData.bloodType) {
        toast.error("Please select a blood type");
        this.setState({ isSubmitting: false });
        return;
      }
      
      if (!formData.donorId) {
        toast.error("Please select a donor");
        this.setState({ isSubmitting: false });
        return;
      }
      
      // Add required fields validation
      if (!formData.bloodCollector) {
        toast.error("Please enter blood collector name");
        this.setState({ isSubmitting: false });
        return;
      }
      
      if (!formData.locationCollected) {
        toast.error("Please enter location collected");
        this.setState({ isSubmitting: false });
        return;
      }
      
      console.log("Submitting blood bag with data:", formData);
      
      // Clear any existing error messages
      this.setState({ errors: {} });
      
      try {
        const savedBloodBag = await saveBloodBag(formData);
        console.log("Blood bag saved successfully:", savedBloodBag);
        toast.success("Blood bag registered successfully!");
        
        // Navigate to inventory page
        this.props.history.push("/inventory");
      } catch (error) {
        console.error("Error saving blood bag:", error);
        toast.error(error.message || "Failed to save blood bag. Please try again.");
        this.setState({ isSubmitting: false });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      this.setState({ isSubmitting: false });
    }
  };

  renderDonorSelect() {
    const { data, donors, errors } = this.state;
    
    return (
      <div className="form-group">
        <label htmlFor="donorId">Donor</label>
        <select
          name="donorId"
          id="donorId"
          value={data.donorId || ""}
          onChange={this.handleChange}
          className="form-control"
        >
          <option value="">Select a Donor</option>
          {Array.isArray(donors) && donors.length > 0 ? (
            donors.map(donor => (
              <option key={donor._id} value={donor._id}>
                {donor.personalInfo && donor.personalInfo.name ? donor.personalInfo.name : 'Unknown'} 
                ({donor.personalInfo && donor.personalInfo.phoneNumber ? donor.personalInfo.phoneNumber : 'No phone'}) - 
                {donor.healthInfo && donor.healthInfo.bloodType ? donor.healthInfo.bloodType : '?'} 
                {donor.healthInfo && donor.healthInfo.rhFactor ? donor.healthInfo.rhFactor : '?'}
              </option>
            ))
          ) : (
            <option value="" disabled>No donors available</option>
          )}
        </select>
        {errors.donorId && (
          <div className="alert alert-danger">{errors.donorId}</div>
        )}
        {(!Array.isArray(donors) || donors.length === 0) && (
          <div className="alert alert-warning mt-2">
            No donors found. Please <a href="/donors/new">register a donor</a> first.
          </div>
        )}
      </div>
    );
  }

  renderBranchId() {
    const { data, errors } = this.state;
    const user = JSON.parse(localStorage.getItem("user")) || {};
    
    return (
      <div className="form-group">
        <label htmlFor="branchId">Branch ID</label>
        <input
          type="text"
          className="form-control"
          id="branchId"
          name="branchId"
          value={data.branchId || user.branchId || ""}
          disabled={true}
          readOnly={true}
        />
        {errors.branchId && (
          <div className="alert alert-danger">{errors.branchId}</div>
        )}
        {!data.branchId && !user.branchId && (
          <div className="alert alert-danger">
            No branch ID found. Please ensure you're assigned to a branch.
          </div>
        )}
      </div>
    );
  }

  render() {
    const { data, loading, isSubmitting } = this.state;
    const isNewBloodBag = this.props.match.params.id === "new";

    if (loading) {
      return <div className="text-center">Loading...</div>;
    }

    // Format blood type options for the select component
    const bloodTypeOptions = [
      { value: "A+", label: "A+" },
      { value: "A-", label: "A-" },
      { value: "B+", label: "B+" },
      { value: "B-", label: "B-" },
      { value: "AB+", label: "AB+" },
      { value: "AB-", label: "AB-" },
      { value: "O+", label: "O+" },
      { value: "O-", label: "O-" }
    ];

    return (
      <div className="container">
        <h1>Blood Bag {data._id ? `ID: ${data._id}` : "New"}</h1>
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              {this.renderSelect(
                "bloodType",
                "Blood Type",
                bloodTypeOptions,
                !isNewBloodBag
              )}
              {this.renderInput(
                "bloodCollector",
                "Blood Collector",
                "text",
                !isNewBloodBag
              )}
              <div className="form-group">
                <label htmlFor="collectionDate">Collection Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="collectionDate"
                  name="collectionDate"
                  value={data.collectionDate}
                  onChange={this.handleDateChange}
                  disabled={!isNewBloodBag}
                />
                {this.state.errors.collectionDate && (
                  <div className="alert alert-danger">
                    {this.state.errors.collectionDate}
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date (Auto-calculated)</label>
                <input
                  type="date"
                  className="form-control"
                  id="expiryDate"
                  name="expiryDate"
                  value={data.expiryDate}
                  onChange={this.handleChange}
                  disabled={true}
                  readOnly={true}
                />
                {this.state.errors.expiryDate && (
                  <div className="alert alert-danger">
                    {this.state.errors.expiryDate}
                  </div>
                )}
              </div>
              {this.renderInput(
                "locationCollected",
                "Location Collected",
                "text",
                !isNewBloodBag
              )}
              {this.renderBranchId()}
            </div>
          </div>
          
          <div className="row">
            <div className="col-12">
              {this.renderDonorSelect()}
            </div>
          </div>

          {isNewBloodBag && (
            <button 
              className="btn btn-primary mt-3" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Blood Bag"}
            </button>
          )}
        </form>
      </div>
    );
  }

  // Override the renderSelect method to handle string options
  renderSelect(name, label, options, disabled = false) {
    const { data, errors } = this.state;

    // If options are strings, convert them to {value, label} objects
    const formattedOptions = Array.isArray(options) && typeof options[0] === 'string'
      ? options.map(opt => ({ value: opt, label: opt }))
      : options;

    return (
      <div className="form-group">
        <label htmlFor={name}>{label}</label>
        <select
          name={name}
          id={name}
          value={data[name]}
          onChange={this.handleChange}
          className="form-control"
          disabled={disabled}
        >
          <option value="">Select {label}</option>
          {formattedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors[name] && (
          <div className="alert alert-danger">{errors[name]}</div>
        )}
      </div>
    );
  }
}

export default BloodBagForm;
