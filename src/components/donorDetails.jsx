import React, { Component } from "react";
import { getDonor } from "../services/donorService";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

class DonorDetails extends Component {
  state = {
    donor: null,
    loading: true,
    error: null
  };

  async componentDidMount() {
    try {
      const donorId = this.props.match.params.id;
      let donorData = await getDonor(donorId);
      console.log("Retrieved donor data:", donorData);
      
      // Handle different response formats (direct data or nested in 'data' property)
      if (donorData && donorData.data) {
        donorData = donorData.data;
      }
      
      if (!donorData || !donorData.personalInfo) {
        throw new Error("Invalid donor data format");
      }
      
      this.setState({ donor: donorData, loading: false });
    } catch (ex) {
      console.error("Error fetching donor details:", ex);
      this.setState({ 
        error: "Failed to load donor details: " + (ex.message || "Unknown error"), 
        loading: false 
      });
      toast.error("Could not load donor details");
      if (ex.response && ex.response.status === 404)
        this.props.history.replace("/not-found");
    }
  }

  formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  render() {
    const { donor, loading, error } = this.state;

    if (loading) return <p>Loading donor details...</p>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!donor) return <div className="alert alert-warning">No donor information found</div>;

    return (
      <div className="container">
        <h2 className="mb-4">Donor Details</h2>
        
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h4>Personal Information</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Name:</strong> {donor.personalInfo.name}</p>
                <p><strong>Age:</strong> {donor.personalInfo.age}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Phone Number:</strong> {donor.personalInfo.phoneNumber}</p>
                <p><strong>Branch ID:</strong> {donor.branchId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h4>Health Information</h4>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Blood Type:</strong> {donor.healthInfo.bloodType}</p>
                <p><strong>Rh Factor:</strong> {donor.healthInfo.rhFactor}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Hemoglobin Level:</strong> {donor.healthInfo.hemoglobinLevel}</p>
                <p><strong>Blood Pressure:</strong> {donor.healthInfo.bloodPressure.systolic}/{donor.healthInfo.bloodPressure.diastolic}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h4>Donation History</h4>
          </div>
          <div className="card-body">
            {donor.donationHistory && donor.donationHistory.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Donation Date</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {donor.donationHistory.map((donation, index) => (
                    <tr key={index}>
                      <td>{this.formatDate(donation.donationDate)}</td>
                      <td>{donation.donationLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No donation history available</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Link to="/donors" className="btn btn-secondary">
            Back to Donors
          </Link>
        </div>
      </div>
    );
  }
}

export default DonorDetails; 