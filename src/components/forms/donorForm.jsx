import React, { Component } from "react";
import { saveDonor, getDonor, deleteDonor } from "../../services/donorService";
import { getBranchById } from "../../services/branchService";
import Joi from "joi-browser";
import { toast } from "react-toastify";

class DonorForm extends Component {
  state = {
    data: {
      _id: "",
      personalInfo: {
        name: "",
        age: "",
        phoneNumber: "",
      },
      healthInfo: {
        bloodType: "",
        rhFactor: "",
        hemoglobinLevel: "",
        bloodPressure: {
          systolic: "",
          diastolic: "",
        },
      },
      branchId: "",
      donationHistory: [{ donationDate: "", donationLocation: "", _id: "" }],
    },
    errors: {},
    permissionError: null,
    user: null,
    isSubmitting: false,
    branchInfo: null,
    checkingBranch: false
  };

  schema = Joi.object({
    _id: Joi.string().allow(""),
    personalInfo: Joi.object({
      name: Joi.string().min(3).max(255).required().label("Name"),
      age: Joi.number().min(18).max(99).required().label("Age"),
      phoneNumber: Joi.string()
        .min(10)
        .max(15)
        .regex(/^\d+$/)
        .required()
        .label("Phone Number"),
    }).required(),
    healthInfo: Joi.object({
      bloodType: Joi.string()
        .valid("A", "B", "AB", "O")
        .required()
        .label("Blood Type"),
      rhFactor: Joi.string()
        .valid("positive", "negative")
        .required()
        .label("Rh Factor"),
      hemoglobinLevel: Joi.number()
        .min(0)
        .max(20)
        .required()
        .label("Hemoglobin Level"),
      bloodPressure: Joi.object({
        systolic: Joi.number()
          .min(0)
          .max(300)
          .required()
          .label("Systolic Pressure"),
        diastolic: Joi.number()
          .min(0)
          .max(200)
          .required()
          .label("Diastolic Pressure"),
      }).required(),
    }).required(),
    branchId: Joi.string().required().label("Branch ID"),
    donationHistory: Joi.array()
      .items(
        Joi.object({
          donationDate: Joi.date().required().label("Donation Date"),
          donationLocation: Joi.string()
            .min(3)
            .max(255)
            .required()
            .label("Donation Location"),
          _id: Joi.string().allow(""),
        })
      )
      .required(),
  }).required();

  async componentDidMount() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        toast.error("Please log in to access this page");
        this.props.history.push("/login");
        return;
      }

      if (!user.branchId) {
        toast.error("You must be assigned to a branch to register donors");
        this.props.history.push("/");
        return;
      }

      // Set the branch ID from the logged-in user's data
      const data = { ...this.state.data };
      data.branchId = user.branchId;
      
      this.setState({ user, data, checkingBranch: true });
      
      // Check if this is the main branch
      try {
        const branchInfo = await getBranchById(user.branchId);
        this.setState({ 
          branchInfo,
          checkingBranch: false
        });
        console.log("Branch info:", branchInfo);
      } catch (branchError) {
        console.error("Error fetching branch info:", branchError);
        this.setState({ checkingBranch: false });
      }

      await this.populateDonor();
    } catch (error) {
      console.error("Error in componentDidMount:", error);
      toast.error("Error initializing form");
      this.setState({ checkingBranch: false });
    }
  }

  async populateDonor() {
    try {
      const donorId = this.props.match.params.id;
      if (donorId === "new") return;

      const { data: donor } = await getDonor(donorId);
      this.setState({ data: this.mapToViewModel(donor) });
    } catch (ex) {
      if (ex.response && ex.response.status === 404)
        this.props.history.replace("/not-found");
    }
  }

  mapToViewModel(donor) {
    return {
      _id: donor._id,
      personalInfo: {
        name: donor.personalInfo.name,
        age: donor.personalInfo.age,
        phoneNumber: donor.personalInfo.phoneNumber,
      },
      healthInfo: {
        bloodType: donor.healthInfo.bloodType,
        rhFactor: donor.healthInfo.rhFactor,
        hemoglobinLevel: donor.healthInfo.hemoglobinLevel,
        bloodPressure: {
          systolic: donor.healthInfo.bloodPressure.systolic,
          diastolic: donor.healthInfo.bloodPressure.diastolic,
        },
      },
      branchId: donor.branchId,
      donationHistory: donor.donationHistory.length
        ? donor.donationHistory
        : [{ donationDate: "", donationLocation: "", _id: "" }],
    };
  }

  handleChange = ({ currentTarget: input }) => {
    const data = { ...this.state.data };
    const keys = input.name.split(".");
    if (keys.length === 1) {
      data[keys[0]] = input.value;
    } else if (keys.length === 2) {
      data[keys[0]][keys[1]] = input.value;
    } else if (keys.length === 3) {
      data[keys[0]][keys[1]][keys[2]] = input.value;
    }
    this.setState({ data }, () => {
      console.log("State updated: ", this.state.data);
    });
  };

  handleAddDonation = () => {
    const { data } = this.state;
    const newData = {
      ...data,
      donationHistory: [
        ...data.donationHistory,
        { donationDate: "", donationLocation: "", _id: "" },
      ],
    };
    this.setState({ data: newData });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const errors = this.validate();
    this.setState({ errors: errors || {} }, () => {
      if (errors) return;
      this.doSubmit();
    });
  };

  handleDelete = async () => {
    const donorId = this.state.data._id;
    try {
      await deleteDonor(donorId);
      this.props.history.push("/donors");
    } catch (ex) {
      if (ex.response && ex.response.status === 404)
        this.props.history.replace("/not-found");
    }
  };

  validate = () => {
    const options = { abortEarly: false };
    const { error } = Joi.validate(this.state.data, this.schema, options);
    if (!error) return null;

    const errors = {};
    for (let item of error.details) errors[item.path.join(".")] = item.message;
    return errors;
  };

  doSubmit = async () => {
    this.setState({ isSubmitting: true });
    try {
      const data = { ...this.state.data };

      // Ensure branch ID is set from the current user
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.branchId) {
        toast.error("No branch ID found. Please ensure you're assigned to a branch.");
        this.setState({ isSubmitting: false });
        return;
      }
      
      // Always use the current user's branch ID
      data.branchId = user.branchId;
      console.log("Using branch ID for new donor:", data.branchId);

      // Remove _id field if it exists
      if (!data._id) {
        delete data._id;
      }

      // Convert numeric fields
      if (data.personalInfo) {
        data.personalInfo.age = Number(data.personalInfo.age);
      }
      
      if (data.healthInfo) {
        data.healthInfo.hemoglobinLevel = Number(data.healthInfo.hemoglobinLevel);
        if (data.healthInfo.bloodPressure) {
          data.healthInfo.bloodPressure.systolic = Number(data.healthInfo.bloodPressure.systolic);
          data.healthInfo.bloodPressure.diastolic = Number(data.healthInfo.bloodPressure.diastolic);
        }
      }

      // Format donation history
      data.donationHistory = data.donationHistory
        .filter(d => d.donationDate && d.donationLocation)
        .map(donation => {
          const { _id, ...donationWithoutId } = donation;
          return donationWithoutId;
        });

      console.log("Saving donor with data:", data);
      await saveDonor(data);
      toast.success("Donor saved successfully!");
      this.props.history.push("/donors");
    } catch (ex) {
      console.error("Error saving donor:", ex);
      if (ex.response && ex.response.status === 403) {
        toast.error("You don't have permission to register donors");
        this.setState({ permissionError: ex.response.data.message });
      } else if (ex.response && ex.response.data) {
        toast.error(ex.response.data);
      } else {
        toast.error("Error saving donor. Please try again.");
      }
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  renderInput(name, label, type = "text", readOnly = false) {
    const { data, errors } = this.state;
    const keys = name.split(".");
    let value;
    if (keys.length === 1) value = data[keys[0]];
    else if (keys.length === 2) value = data[keys[0]][keys[1]];
    else if (keys.length === 3) value = data[keys[0]][keys[1]][keys[2]];

    return (
      <div className="form-group">
        <label htmlFor={name}>{label}</label>
        <input
          value={value}
          onChange={this.handleChange}
          id={name}
          name={name}
          type={type}
          className="form-control"
          readOnly={readOnly}
        />
        {errors[name] && (
          <div className="alert alert-danger">{errors[name]}</div>
        )}
      </div>
    );
  }

  renderSelect(name, label, options, readOnly = false) {
    const { data, errors } = this.state;
    const keys = name.split(".");
    let value;
    if (keys.length === 1) value = data[keys[0]];
    else if (keys.length === 2) value = data[keys[0]][keys[1]];
    else if (keys.length === 3) value = data[keys[0]][keys[1]][keys[2]];

    return (
      <div className="form-group">
        <label htmlFor={name}>{label}</label>
        <select
          value={value}
          onChange={this.handleChange}
          id={name}
          name={name}
          className="form-control"
          disabled={readOnly}
        >
          <option value="" />
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors[name] && (
          <div className="alert alert-danger">{errors[name]}</div>
        )}
      </div>
    );
  }

  renderButton(label) {
    return (
      <button disabled={this.validate()} className="btn btn-primary">
        {label}
      </button>
    );
  }

  renderBranchField() {
    const { data, branchInfo, checkingBranch } = this.state;
    
    return (
      <div className="form-group mt-3">
        <label htmlFor="branchId">Branch ID (Auto-filled)</label>
        <input
          value={data.branchId || ""}
          id="branchId"
          name="branchId"
          type="text"
          className="form-control"
          readOnly={true}
          disabled={true}
        />
        {checkingBranch ? (
          <small className="form-text text-muted">
            Checking branch information...
          </small>
        ) : branchInfo ? (
          <small className="form-text text-muted">
            This donor will be registered to {branchInfo.name} ({branchInfo.isMainOffice ? "Main Branch" : "Regular Branch"}) in {branchInfo.location}.
          </small>
        ) : (
          <small className="form-text text-muted">
            This is your current branch ID. New donors will be registered to this branch.
          </small>
        )}
      </div>
    );
  }

  render() {
    const { permissionError, user, isSubmitting } = this.state;
    const readOnly =
      !(user && user.role === "Staff Member") && this.state.data._id !== "";

    return (
      <div className="container">
        <h1 className="mb-4">
          {this.state.data._id
            ? `Donor ID: ${this.state.data._id}`
            : "New Donor"}
        </h1>
        {permissionError && (
          <div className="alert alert-danger">{permissionError}</div>
        )}
        <form onSubmit={this.handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <h3>Personal Information</h3>
              {this.renderInput("personalInfo.name", "Name", "text", readOnly)}
              {this.renderInput("personalInfo.age", "Age", "number", readOnly)}
              {this.renderInput("personalInfo.phoneNumber", "Phone Number")}
            </div>
            <div className="col-md-6">
              <h3>Health Information</h3>
              {this.renderSelect(
                "healthInfo.bloodType",
                "Blood Type",
                ["A", "B", "AB", "O"],
                readOnly
              )}
              {this.renderSelect(
                "healthInfo.rhFactor",
                "Rh Factor",
                ["positive", "negative"],
                readOnly
              )}
              {this.renderInput(
                "healthInfo.hemoglobinLevel",
                "Hemoglobin Level",
                "number",
                readOnly
              )}
              <div className="row">
                <div className="col">
                  {this.renderInput(
                    "healthInfo.bloodPressure.systolic",
                    "Systolic Pressure",
                    "number",
                    readOnly
                  )}
                </div>
                <div className="col">
                  {this.renderInput(
                    "healthInfo.bloodPressure.diastolic",
                    "Diastolic Pressure",
                    "number",
                    readOnly
                  )}
                </div>
              </div>
              {/* Display branch ID with branch type information */}
              {this.renderBranchField()}
            </div>
          </div>

          <div className="mt-4">
            <h3>Donation History</h3>
            {this.state.data.donationHistory.map((donation, index) => (
              <div key={index} className="card mb-3">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      {this.renderInput(
                        `donationHistory.${index}.donationDate`,
                        "Donation Date",
                        "date",
                        readOnly
                      )}
                    </div>
                    <div className="col-md-6">
                      {this.renderInput(
                        `donationHistory.${index}.donationLocation`,
                        "Donation Location",
                        "text",
                        readOnly
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!readOnly && (
            <div className="mt-3 mb-4">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={this.handleAddDonation}
              >
                Add Donation Record
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Donor"}
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }
}

export default DonorForm;
