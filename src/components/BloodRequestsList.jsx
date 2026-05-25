import React, { Component } from "react";
import { toast } from "react-toastify";
import { getBloodRequests, saveBloodRequest, getAllBloodRequests } from "../services/bloodRequestService";
import Table from "./common/table";
import moment from "moment";

class BloodRequestsList extends Component {
  state = {
    requests: [],
    loading: true,
    error: null,
    isAdmin: false,
    isSuperAdmin: false,
    showAllRequests: false
  };

  columns = [
    {
      path: "bloodType",
      label: "Blood Type",
      content: request => (
        <span className="badge bg-danger">{request.bloodType}</span>
      )
    },
    { path: "quantity", label: "Quantity (units)" },
    { path: "hospitalName", label: "Hospital" },
    {
      path: "status",
      label: "Status",
      content: request => this.getStatusBadge(request.status)
    },
    {
      path: "createdAt",
      label: "Requested On",
      content: request => this.formatDate(request.createdAt)
    }
  ];

  componentDidMount() {
    // Check if user is Admin or SuperAdmin
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const isAdmin = user.role === "Admin";
      const isSuperAdmin = user.role === "Super Admin";
      this.setState({ isAdmin, isSuperAdmin });

      // Add action column for Admin or SuperAdmin
      if (isAdmin || isSuperAdmin) {
        this.columns.push(this.getActionColumn());
      }
    }

    this.fetchRequests();
  }

  toggleRequestView = () => {
    this.setState(
      prevState => ({ showAllRequests: !prevState.showAllRequests }),
      this.fetchRequests
    );
  };

  fetchRequests = async () => {
    this.setState({ loading: true, error: null });

    try {
      let response;
      if (this.state.isSuperAdmin && this.state.showAllRequests) {
        // If Super Admin and showing all requests
        console.log("Fetching ALL blood requests for Super Admin");
        response = await getAllBloodRequests();
      } else {
        // Regular requests (forwarded for Super Admin)
        console.log("Fetching regular blood requests");
        response = await getBloodRequests();
      }

      const requests = response.data;
      console.log("Received requests:", requests);
      console.log("Super Admin status:", this.state.isSuperAdmin);
      
      // Debug: Log each request status
      if (this.state.isSuperAdmin) {
        requests.forEach((request, index) => {
          console.log(`Request #${index} status: '${request.status}'`);
        });
      }
      
      this.setState({ requests, loading: false });
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      this.setState({
        error: "Failed to load blood requests. Please try again later.",
        loading: false
      });
    }
  };

  getStatusBadge = status => {
    let badgeClass = "badge ";
    switch (status.toLowerCase()) {
      case "pending":
        badgeClass += "bg-warning";
        break;
      case "approved":
        badgeClass += "bg-success";
        break;
      case "rejected":
        badgeClass += "bg-danger";
        break;
      case "forwarded":
        badgeClass += "bg-info";
        break;
      default:
        badgeClass += "bg-secondary";
    }
    return <span className={badgeClass}>{status}</span>;
  };

  formatDate = date => {
    if (!date) return "-";
    return moment(date).format("MMM D, YYYY");
  };

  getActionColumn = () => {
    return {
      key: "action",
      label: "Action",
      content: request => {
        console.log("Rendering action for request:", request);
        console.log("Status:", request.status, "Type:", typeof request.status);
        console.log("Is Admin:", this.state.isAdmin, "Is Super Admin:", this.state.isSuperAdmin);
        
        if (this.state.isAdmin) {
          // Branch Admin actions
          if (request.status && request.status.toLowerCase() === "pending") {
            return (
              <div className="btn-group" role="group">
                <button
                  onClick={() => this.handleForward(request)}
                  className="btn btn-sm btn-primary"
                >
                  Forward
                </button>
              </div>
            );
          }
        } else if (this.state.isSuperAdmin) {
          // Super Admin actions - fix status check to be more robust
          const status = String(request.status || '').toLowerCase();
          console.log("Super Admin checking status:", status);
          
          // Check for any form of "forwarded" status (with more logging)
          if (status === "forwarded" || status.includes("forward")) {
            console.log("Showing approve button for Super Admin");
            return (
              <div className="btn-group" role="group">
                <button
                  onClick={() => this.handleApprove(request)}
                  className="btn btn-sm btn-success"
                >
                  Approve
                </button>
                <button
                  onClick={() => this.handleReject(request)}
                  className="btn btn-sm btn-danger"
                >
                  Reject
                </button>
              </div>
            );
          } else {
            console.log("No action available for status:", status);
          }
        }
        return null;
      }
    };
  };

  handleApprove = async request => {
    try {
      console.log("Super Admin approving request:", request);
      // Update request status to approved
      const updatedRequest = { ...request, status: "approved" };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request approved successfully");
      this.fetchRequests();
    } catch (error) {
      console.error("Error approving blood request:", error);
      toast.error("Failed to approve blood request");
    }
  };

  handleReject = async request => {
    try {
      console.log("Super Admin rejecting request:", request);
      // Update request status to rejected
      const updatedRequest = { ...request, status: "rejected" };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request rejected successfully");
      this.fetchRequests();
    } catch (error) {
      console.error("Error rejecting blood request:", error);
      toast.error("Failed to reject blood request");
    }
  };

  handleForward = async request => {
    try {
      // Update request status to forwarded
      const updatedRequest = { ...request, status: "forwarded" };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request forwarded to Super Admin");
      this.fetchRequests();
    } catch (error) {
      console.error("Error forwarding blood request:", error);
      toast.error("Failed to forward blood request");
    }
  };

  render() {
    const { requests, loading, error, isSuperAdmin, showAllRequests } = this.state;

    if (loading) {
      return (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Blood Requests</h2>
          {isSuperAdmin && (
            <button 
              className="btn btn-outline-primary" 
              onClick={this.toggleRequestView}
            >
              {showAllRequests ? "Show Forwarded Requests" : "Show All Requests"}
            </button>
          )}
        </div>
        
        {requests.length === 0 ? (
          <div className="alert alert-info">No blood requests found.</div>
        ) : (
          <Table columns={this.columns} data={requests} />
        )}
      </div>
    );
  }
}

export default BloodRequestsList; 