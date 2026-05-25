import React from "react";
import { withRouter } from "react-router-dom"; // Import withRouter
import Joi from "joi-browser";
import Form from "../common/form";
import { getUserById, saveUser } from "../../services/userService";
import auth from "../../services/authService";
import styled from "styled-components";
import { toast } from "react-toastify";
import userService from "../../services/userService";
import http from "../../services/httpService";
import { apiUrl } from "../../config.json";

const FormSection = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: #fff;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
`;

const FormTitle = styled.h4`
  margin: 0;
  font-weight: 600;
`;

const FormIcon = styled.i`
  font-size: 1rem;
  transition: transform 0.3s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0)'};
`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
`;

const FormColumn = styled.div`
  flex: 1 0 ${props => props.width || "100%"};
  padding: 0 10px;
  min-width: 250px;
  
  @media (max-width: 768px) {
    flex: 1 0 100%;
  }
`;

// Define valid system roles
const SYSTEM_ROLES = [
  { value: "", label: "Select Role" },
  { value: "Super Admin", label: "Super Admin" },
  { value: "Admin", label: "Admin" },
  { value: "Hospital Admin", label: "Hospital Admin" },
  { value: "Staff Member", label: "Staff Member" }
];

class RegisterForm extends Form {
  state = {
    data: {
      name: "",
      email: "",
      password: "",
      role: "",
      branchId: "",
      hospitalName: "",
      contactDetails: {
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: ""
      },
      personalInfo: {
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        bloodType: ""
      },
      employmentInfo: {
        joinDate: "",
        specialization: "",
        levelOfStudy: "",
        employeeId: ""
      },
      emergencyContact: {
        name: "",
        relationship: "",
        phone: ""
      }
    },
    errors: {},
    loading: false,
    accountInfoExpanded: true,
    personalInfoExpanded: true,
    contactInfoExpanded: true,
    employmentInfoExpanded: false,
    emergencyContactExpanded: false,
    isUpdating: false,
    availableRoles: []
  };

  schema = {
    _id: Joi.string(),
    name: Joi.string().required().label("Name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().min(5).label("Password"),
    role: Joi.string().valid(
      "", "Super Admin", "Admin", "Hospital Admin", "Staff Member"
    ).required().label("Role"),
    branchId: Joi.string().allow("").label("Branch ID"),
    hospitalName: Joi.string().when('role', {
      is: 'Hospital Admin',
      then: Joi.required().label("Hospital Name"),
      otherwise: Joi.allow("").label("Hospital Name")
    }),
    contactDetails: {
      phone: Joi.string().allow("").label("Phone Number"),
      address: Joi.string().allow("").label("Address"),
      city: Joi.string().allow("").label("City"),
      state: Joi.string().allow("").label("State"),
      zipCode: Joi.string().allow("").label("Zip Code")
    },
    personalInfo: {
      firstName: Joi.string().allow("").label("First Name"),
      lastName: Joi.string().allow("").label("Last Name"),
      gender: Joi.string().allow("").label("Gender"),
      dateOfBirth: Joi.string().allow("").label("Date of Birth"),
      bloodType: Joi.string().allow("").label("Blood Type")
    },
    employmentInfo: {
      joinDate: Joi.string().allow("").label("Join Date"),
      specialization: Joi.string().allow("").label("Specialization"),
      levelOfStudy: Joi.string().allow("").label("Level of Study"),
      employeeId: Joi.string().allow("").label("Employee ID")
    },
    emergencyContact: {
      name: Joi.string().allow("").label("Emergency Contact Name"),
      relationship: Joi.string().allow("").label("Relationship"),
      phone: Joi.string().allow("").label("Emergency Contact Phone")
    }
  };

  populateUser = async () => {
    try {
      const userId = this.props.match.params.id;
      if (userId === "new") {
        this.setState({ isUpdating: false });
        return;
      }

      const user = await getUserById(userId);
      this.setState({ data: this.mapToViewModel(user), isUpdating: true });
    } catch (ex) {
      if (ex.response && ex.response.status === 404)
        this.props.history.replace("/not-found");
    }
  };

  async componentDidMount() {
    await this.populateUser();
    await this.fetchAvailableRoles();
  }

  fetchAvailableRoles = async () => {
    try {
      console.log("Fetching available roles from API...");
      // Use the userService function to get roles
      const rolesData = await userService.getAvailableRoles();
      
      if (rolesData && Array.isArray(rolesData)) {
        // Convert roles to the format needed for the select component
        const roles = rolesData.map(role => ({
          value: role,
          label: role
        }));
        
        // Add empty option at the beginning
        roles.unshift({ value: "", label: "Select Role" });
        
        // Filter roles based on user permissions
        const filteredRoles = this.filterRolesByPermission(roles);
        
        this.setState({ availableRoles: filteredRoles });
        console.log("Fetched and filtered roles:", filteredRoles);
      } else {
        // Fallback to hardcoded roles if response is not as expected
        this.setDefaultRoles();
      }
    } catch (error) {
      console.warn("Could not fetch roles from backend, using default roles:", error);
      this.setDefaultRoles();
    }
  };

  // Filter roles based on current user's permissions
  filterRolesByPermission = (roles) => {
    const currentUser = auth.getCurrentUser();
    
    // If no user is logged in or roles array is empty, return empty array
    if (!roles || roles.length === 0) return [SYSTEM_ROLES[0]];
    
    // Always keep the empty "Select Role" option
    const filteredRoles = [roles[0]];
    
    if (!currentUser) {
      // If not logged in, only show the "Select Role" option
      return filteredRoles;
    }
    
    // Super Admin can assign any role
    if (currentUser.role === "Super Admin") {
      return roles;
    }
    
    // Admin can only assign Staff Member roles
    if (currentUser.role === "Admin") {
      // Add info message about branch association
      setTimeout(() => {
        toast.info("Staff Members you create will automatically be associated with your branch.");
      }, 500);
      
      return filteredRoles.concat(
        roles.filter(role => role.value === "Staff Member")
      );
    }
    
    // Other roles can't assign roles
    return [roles[0]]; // Just the "Select Role" option
  };

  setDefaultRoles = () => {
    // Use the constant for consistent system roles
    const filteredRoles = this.filterRolesByPermission(SYSTEM_ROLES);
    this.setState({ availableRoles: filteredRoles });
    console.log("Using filtered default roles:", filteredRoles);
  };

  mapToViewModel(user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      branchId: user.branchId || "",
      hospitalName: user.hospitalName || "",
      contactDetails: {
        phone: (user.contactDetails && user.contactDetails.phone) || "",
        address: (user.contactDetails && user.contactDetails.address) || "",
        city: (user.contactDetails && user.contactDetails.city) || "",
        state: (user.contactDetails && user.contactDetails.state) || "",
        zipCode: (user.contactDetails && user.contactDetails.zipCode) || ""
      },
      personalInfo: {
        firstName: (user.personalInfo && user.personalInfo.firstName) || "",
        lastName: (user.personalInfo && user.personalInfo.lastName) || "",
        gender: (user.personalInfo && user.personalInfo.gender) || "",
        dateOfBirth: (user.personalInfo && user.personalInfo.dateOfBirth) || "",
        bloodType: (user.personalInfo && user.personalInfo.bloodType) || ""
      },
      employmentInfo: {
        joinDate: (user.employmentInfo && user.employmentInfo.joinDate) || "",
        specialization: (user.employmentInfo && user.employmentInfo.specialization) || "",
        levelOfStudy: (user.employmentInfo && user.employmentInfo.levelOfStudy) || "",
        employeeId: (user.employmentInfo && user.employmentInfo.employeeId) || ""
      },
      emergencyContact: {
        name: (user.emergencyContact && user.emergencyContact.name) || "",
        relationship: (user.emergencyContact && user.emergencyContact.relationship) || "",
        phone: (user.emergencyContact && user.emergencyContact.phone) || ""
      }
    };
  }

  toggleSection = (section) => {
    this.setState({ [section]: !this.state[section] });
  };

  handleRoleChange = (e) => {
    const { name, value } = e.target;
    const data = { ...this.state.data };
    data[name] = value;
    
    // Clear branchId and hospitalName when role changes
    data.branchId = "";
      data.hospitalName = "";
    
    this.setState({ data });
  };

  doSubmit = async () => {
    this.setState({ loading: true });
    try {
      console.log("Submitting user data:", this.state.data);
      
      // Get current user for role-based logic
      const currentUser = auth.getCurrentUser();
      
      // Create a clean user object with all required fields
      const userData = {
        ...this.state.data,
        // Ensure required fields are present and properly formatted
        name: this.state.data.name,
        email: this.state.data.email,
        password: this.state.data.password || "",  // Allow empty for updates
        role: this.state.data.role,
        // If Admin is creating a Staff Member, automatically assign the Admin's branchId
        branchId: (currentUser && currentUser.role === "Admin" && this.state.data.role === "Staff Member") 
          ? currentUser.branchId 
          : (this.state.data.branchId || ""),
        hospitalName: this.state.data.role === "Hospital Admin" ? this.state.data.hospitalName : "",
        contactDetails: this.state.data.contactDetails || {
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: ""
        },
        personalInfo: this.state.data.personalInfo || {
          firstName: "",
          lastName: "",
          gender: "",
          dateOfBirth: "",
          bloodType: ""
        },
        employmentInfo: this.state.data.employmentInfo || {
          joinDate: "",
          specialization: "",
          levelOfStudy: "",
          employeeId: ""
        },
        emergencyContact: this.state.data.emergencyContact || {
          name: "",
          relationship: "",
          phone: ""
        }
      };
      
      // Log the constructed user data
      console.log("Prepared user data for API submission:", userData);
      
      // Save user data through service
      const response = await saveUser(userData);
      console.log("Save user response:", response);
      
      // Show success message
      toast.success(this.state.isUpdating ? "User updated successfully!" : "User registered successfully!");
      
      // Redirect or reset form based on the response
      if (!this.state.isUpdating) {
      this.props.history.push("/users");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      
      if (error.response && error.response.data) {
        // Show specific error from the backend
        toast.error(error.response.data);
      } else {
        // Generic error message
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { 
      isUpdating, 
      accountInfoExpanded, 
      personalInfoExpanded,
      contactInfoExpanded,
      employmentInfoExpanded,
      emergencyContactExpanded,
      availableRoles 
    } = this.state;
    const user = auth.getCurrentUser();
    
    const genderOptions = [
      { value: "", label: "Select Gender" },
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" }
    ];
    
    const bloodTypeOptions = [
      { value: "", label: "Select Blood Type" },
      { value: "A+", label: "A+" },
      { value: "A-", label: "A-" },
      { value: "B+", label: "B+" },
      { value: "B-", label: "B-" },
      { value: "AB+", label: "AB+" },
      { value: "AB-", label: "AB-" },
      { value: "O+", label: "O+" },
      { value: "O-", label: "O-" }
    ];

    // Define education level options
    const levelOfStudyOptions = [
      { value: "", label: "Select Level of Study" },
      { value: "Associate Degree", label: "Associate Degree" },
      { value: "Bachelor's Degree", label: "Bachelor's Degree" },
      { value: "Master's Degree", label: "Master's Degree" },
      { value: "Doctorate", label: "Doctorate" },
      { value: "Medical Degree", label: "Medical Degree" }
    ];

    return (
      <div className="register-form-container">
        <h1>{isUpdating ? "Update User" : "Register New User"}</h1>
        <form onSubmit={this.handleSubmit}>
          {/* Account Information Section */}
          <FormSection>
            <SectionHeader onClick={() => this.toggleSection("accountInfoExpanded")}>
              <FormTitle>Account Information</FormTitle>
              <FormIcon expanded={accountInfoExpanded} className="fa fa-chevron-down" />
            </SectionHeader>
            {accountInfoExpanded && (
              <div className="form-fields-container">
                {this.renderInput("name", "Name")}
                {this.renderInput("email", "Email")}
                {this.renderInput("password", "Password", "password", 
                  isUpdating ? "Leave blank to keep current password" : "")}

                {this.renderSelect("role", "Role", availableRoles, this.handleRoleChange)}

                {this.state.data.role === "Hospital Admin" ? (
                  <FormColumn width="50%">
                    {this.renderInput("hospitalName", "Hospital Name")}
                  </FormColumn>
                ) : this.state.data.role !== "" && this.state.data.role !== "Super Admin" ? (
                  <FormColumn width="50%">
                    {this.renderInput("branchId", "Branch ID")}
                  </FormColumn>
                ) : null}
              </div>
            )}
          </FormSection>
          
          {/* Personal Information Section */}
          <FormSection>
            <SectionHeader onClick={() => this.toggleSection("personalInfoExpanded")}>
              <FormTitle>Personal Information</FormTitle>
              <FormIcon expanded={personalInfoExpanded} className="fa fa-chevron-down" />
            </SectionHeader>
            {personalInfoExpanded && (
              <div className="form-fields-container">
                <FormRow>
                  <FormColumn width="50%">
                    {this.renderInput("personalInfo.firstName", "First Name")}
                  </FormColumn>
                  <FormColumn width="50%">
                    {this.renderInput("personalInfo.lastName", "Last Name")}
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn width="50%">
                    {this.renderSelect("personalInfo.gender", "Gender", genderOptions)}
                  </FormColumn>
                  <FormColumn width="50%">
                    {this.renderInput("personalInfo.dateOfBirth", "Date of Birth", "date")}
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn width="50%">
                    {this.renderSelect("personalInfo.bloodType", "Blood Type", bloodTypeOptions)}
                  </FormColumn>
                </FormRow>
              </div>
            )}
          </FormSection>

          {/* Contact Information Section */}
          <FormSection>
            <SectionHeader onClick={() => this.toggleSection("contactInfoExpanded")}>
              <FormTitle>Contact Information</FormTitle>
              <FormIcon expanded={contactInfoExpanded} className="fa fa-chevron-down" />
            </SectionHeader>
            {contactInfoExpanded && (
              <div className="form-fields-container">
                <FormRow>
                  <FormColumn>
                    {this.renderInput("contactDetails.phone", "Phone Number")}
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn>
                    {this.renderInput("contactDetails.address", "Address")}
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn width="33.33%">
                    {this.renderInput("contactDetails.city", "City")}
                  </FormColumn>
                  <FormColumn width="33.33%">
                    {this.renderInput("contactDetails.state", "State")}
                  </FormColumn>
                  <FormColumn width="33.33%">
                    {this.renderInput("contactDetails.zipCode", "Zip Code")}
                  </FormColumn>
                </FormRow>
              </div>
            )}
          </FormSection>
          
          {/* Employment Information Section */}
          <FormSection>
            <SectionHeader onClick={() => this.toggleSection("employmentInfoExpanded")}>
              <FormTitle>Employment Information</FormTitle>
              <FormIcon expanded={employmentInfoExpanded} className="fa fa-chevron-down" />
            </SectionHeader>
            {employmentInfoExpanded && (
              <div className="form-fields-container">
                <FormRow>
                  <FormColumn width="50%">
                    {this.renderInput("employmentInfo.joinDate", "Join Date", "date")}
                  </FormColumn>
                  <FormColumn width="50%">
                    {this.renderInput("employmentInfo.employeeId", "Employee ID", "text", "Enter unique ID used for employee identification (e.g., EMP001)")}
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn width="50%">
                    {this.renderInput("employmentInfo.specialization", "Specialization", "text", "Enter medical or professional specialization")}
                  </FormColumn>
                  <FormColumn width="50%">
                    {this.renderSelect("employmentInfo.levelOfStudy", "Level of Study", levelOfStudyOptions)}
                  </FormColumn>
                </FormRow>
              </div>
            )}
          </FormSection>
          
          {/* Emergency Contact Section */}
          <FormSection>
            <SectionHeader onClick={() => this.toggleSection("emergencyContactExpanded")}>
              <FormTitle>Emergency Contact</FormTitle>
              <FormIcon expanded={emergencyContactExpanded} className="fa fa-chevron-down" />
            </SectionHeader>
            {emergencyContactExpanded && (
              <div className="form-fields-container">
                <FormRow>
                  <FormColumn width="50%">
                    {this.renderInput("emergencyContact.name", "Contact Name")}
                  </FormColumn>
                  <FormColumn width="50%">
                    {this.renderInput("emergencyContact.relationship", "Relationship")}
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn>
                    {this.renderInput("emergencyContact.phone", "Emergency Phone")}
                  </FormColumn>
                </FormRow>
              </div>
            )}
          </FormSection>

          {/* Form submission button */}
          <div className="form-group">
            {this.renderButton(isUpdating ? "Update User" : "Register User")}
          </div>
        </form>
      </div>
    );
  }
}

export default withRouter(RegisterForm);
