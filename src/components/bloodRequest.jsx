import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import BloodRequestTable from "./tables/bloodRequestTable";
import Pagination from "./common/pagination";
import {
  getBloodRequests,
  deleteBloodRequest,
  saveBloodRequest,
  updateBloodRequestStatus,
  partialFulfillRequest,
  cancelBloodRequest,
  requestAdditionalInfo,
  provideAdditionalInfo,
  getAllBloodRequests
} from "../services/bloodRequestService";
import { paginate } from "../utils/paginate";
import _ from "lodash";
import { useUser } from "../context/userContext";
import { toast } from "react-toastify";
import "../App.css"; // Import the stylesheet

const BloodRequests = () => {
  const user = useUser();
  const [bloodRequests, setBloodRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [sortColumn, setSortColumn] = useState({
    path: "requester",
    order: "asc",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const tableRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBloodRequests = async () => {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    
    try {
      setIsLoading(true);
      console.log("Fetching blood requests for user role:", user?.role);
      
      // For Super Admin, fetch all requests instead of filtered ones
      const response = user && user.role === "Super Admin" 
        ? await getAllBloodRequests() 
        : await getBloodRequests();
      
      console.log("Blood requests data received:", response);
      
      if (response && response.data) {
        console.log("Setting blood requests count:", response.data.length);
        console.log("Sample first request (if exists):", response.data[0] || "No requests found");
        
        setBloodRequests(response.data);
        applyFilters(response.data, statusFilter, priorityFilter, searchQuery);
      } else {
        console.error("Blood requests data is invalid:", response);
        setBloodRequests([]);
        setFilteredRequests([]);
        setError("Received invalid data format from server");
      }
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      setBloodRequests([]);
      setFilteredRequests([]);
      setError("Failed to fetch blood requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Combined useEffect for initial fetch and polling
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchBloodRequests();

    // Set up polling for status updates every 30 seconds
    const pollInterval = setInterval(fetchBloodRequests, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
  }, [user]);

  // Combined useEffect for filters and table scroll
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    applyFilters(bloodRequests, statusFilter, priorityFilter, searchQuery);
  }, [bloodRequests, statusFilter, priorityFilter, searchQuery]);

  const applyFilters = useCallback((requests, status, priority, query) => {
    let filtered = [...requests];
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(request => request.status === status);
    }
    
    // Apply priority filter
    if (priority !== "all") {
      filtered = filtered.filter(request => request.priority === priority);
    }
    
    // Apply search query filter
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      filtered = filtered.filter(
        request =>
          (request.hospitalName && request.hospitalName.toLowerCase().includes(lowercasedQuery)) ||
          (request.bloodType && request.bloodType.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    setFilteredRequests(filtered);
    // Reset to first page when changing filters
    setCurrentPage(1);
  }, []);

  const handleDelete = async (bloodRequest) => {
    const originalBloodRequests = bloodRequests;
    const updatedBloodRequests = bloodRequests.filter(
      (b) => b._id !== bloodRequest._id
    );
    setBloodRequests(updatedBloodRequests);
    applyFilters(updatedBloodRequests, statusFilter, priorityFilter, searchQuery);

    try {
      await deleteBloodRequest(bloodRequest._id);
      toast.success("Blood request deleted successfully");
    } catch (error) {
      setBloodRequests(originalBloodRequests);
      applyFilters(originalBloodRequests, statusFilter, priorityFilter, searchQuery);
      setError("Failed to delete blood request");
      toast.error("Failed to delete blood request");
      console.error("Error deleting blood request:", error);
    }
  };

  const handleAccept = async (bloodRequest, newBranchId) => {
    try {
      // If newBranchId is provided, we're doing a reassignment by Super Admin
      if (newBranchId && user && user.role === "Super Admin") {
        console.log("Super Admin reassigning blood request to branch:", newBranchId);
        console.log("Original branch ID:", bloodRequest.branchId);
        
        const updatedRequest = { 
          ...bloodRequest, 
          status: "approved",
          branchId: newBranchId,
          reassignedBy: user._id,
          notes: bloodRequest.notes ? 
            `${bloodRequest.notes}\n\nReassigned by Super Admin to new branch.` : 
            "Reassigned by Super Admin to new branch."
        };
        
        console.log("Sending updated request for reassignment:", updatedRequest);
        const response = await saveBloodRequest(updatedRequest);
        console.log("Reassignment response:", response);
        
        toast.success("Blood request approved and reassigned to new branch");
      } else {
        // Regular approval
        const updatedRequest = { ...bloodRequest, status: "approved" };
        await saveBloodRequest(updatedRequest);
        toast.success("Blood request approved successfully");
      }
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to accept blood request");
      toast.error("Failed to approve blood request");
      console.error("Error accepting blood request:", error);
    }
  };

  const handleReject = async (bloodRequest, rejectionReason) => {
    try {
      const updatedRequest = { 
        ...bloodRequest, 
        status: "rejected",
        rejectionReason: rejectionReason 
      };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request rejected");
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to reject blood request");
      toast.error("Failed to reject blood request");
      console.error("Error rejecting blood request:", error);
    }
  };

  const handleForward = async (bloodRequest, forwardReason) => {
    try {
      const updatedRequest = { 
        ...bloodRequest, 
        status: "forwarded",
        forwardReason: forwardReason,
        notes: bloodRequest.notes ? 
          `${bloodRequest.notes}\n\nForwarded to Super Admin: ${forwardReason}` : 
          `Forwarded to Super Admin: ${forwardReason}`
      };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request forwarded to Super Admin");
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to forward blood request");
      console.error("Error forwarding blood request:", error);
      toast.error("Failed to forward blood request");
    }
  };

  const handleUpdateStatus = async (bloodRequest, newStatus) => {
    try {
      await updateBloodRequestStatus(bloodRequest._id, newStatus);
      toast.success(`Blood request status updated to ${newStatus}`);
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError(`Failed to update blood request to ${newStatus}`);
      toast.error(`Failed to update status to ${newStatus}`);
      console.error("Error updating blood request status:", error);
    }
  };

  const handlePartialFulfill = async (bloodRequest, availableUnits, notes) => {
    try {
      await partialFulfillRequest(bloodRequest._id, availableUnits, notes);
      toast.success(`Blood request partially fulfilled with ${availableUnits} units`);
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to partially fulfill blood request");
      toast.error("Failed to partially fulfill request");
      console.error("Error partially fulfilling blood request:", error);
    }
  };

  const handleCancel = async (bloodRequest, reason) => {
    try {
      await cancelBloodRequest(bloodRequest._id, reason);
      toast.success("Blood request cancelled");
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to cancel blood request");
      toast.error("Failed to cancel blood request");
      console.error("Error cancelling blood request:", error);
    }
  };

  const handleRequestInfo = async (bloodRequest, infoRequest) => {
    try {
      await requestAdditionalInfo(bloodRequest._id, infoRequest);
      toast.success("Information requested from hospital");
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to request additional information");
      toast.error("Failed to request information");
      console.error("Error requesting information:", error);
    }
  };

  const handleProvideInfo = async (bloodRequest, additionalInfo) => {
    try {
      await provideAdditionalInfo(bloodRequest._id, additionalInfo);
      toast.success("Additional information provided");
      await fetchBloodRequests(); // Refresh the list
    } catch (error) {
      setError("Failed to provide additional information");
      toast.error("Failed to provide information");
      console.error("Error providing information:", error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (sortColumn) => {
    setSortColumn(sortColumn);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  const handlePriorityFilterChange = (priority) => {
    setPriorityFilter(priority);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Check if there are any blood requests
  if (error) return <p className="alert alert-danger">{error}</p>;
  
  // Safe check to ensure bloodRequests is an array
  if (!Array.isArray(bloodRequests)) {
    console.error("bloodRequests is not an array:", bloodRequests);
    return <p className="alert alert-warning">Invalid data format received from server</p>;
  }
  
  // Handle empty blood requests
  if (bloodRequests.length === 0) {
    return (
      <div className="container">
        {user && user.role === "Hospital Admin" && (
          <div>
            <div className="mb-3">
              <Link to="/blood-request/new" className="btn btn-primary">
                New Blood Request
              </Link>
            </div>
            <p className="alert alert-info">
              You haven't submitted any blood requests yet. Use the "New Blood Request" button above to submit a request.
            </p>
          </div>
        )}
        {(!user || user.role !== "Hospital Admin") && (
          <p className="alert alert-info">There are no blood requests in the database</p>
        )}
      </div>
    );
  }

  const sorted = _.orderBy(
    filteredRequests,
    [sortColumn.path],
    [sortColumn.order]
  );

  const paginatedRequests = paginate(sorted, currentPage, pageSize);

  return (
    <div className="container">
      <div className="content-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            {user && user.role === "Hospital Admin" && (
              <Link to="/blood-request/new" className="btn btn-primary">
                <i className="fas fa-plus-circle me-2"></i>
                New Blood Request
              </Link>
            )}
          </div>
          
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by hospital or blood type..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                Status Filter
              </div>
              <div className="card-body">
                <div className="btn-group d-flex flex-wrap">
                  <button 
                    className={`btn ${statusFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleStatusFilterChange("all")}
                  >
                    All
                  </button>
                  <button 
                    className={`btn ${statusFilter === "pending" ? "btn-warning" : "btn-outline-warning"}`}
                    onClick={() => handleStatusFilterChange("pending")}
                  >
                    Pending
                  </button>
                  <button 
                    className={`btn ${statusFilter === "forwarded" ? "btn-info" : "btn-outline-info"}`}
                    onClick={() => handleStatusFilterChange("forwarded")}
                  >
                    Forwarded
                  </button>
                  <button 
                    className={`btn ${statusFilter === "approved" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => handleStatusFilterChange("approved")}
                  >
                    Approved
                  </button>
                  <button 
                    className={`btn ${statusFilter === "rejected" ? "btn-danger" : "btn-outline-danger"}`}
                    onClick={() => handleStatusFilterChange("rejected")}
                  >
                    Rejected
                  </button>
                  <button 
                    className={`btn ${statusFilter === "in-progress" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleStatusFilterChange("in-progress")}
                  >
                    In Progress
                  </button>
                  <button 
                    className={`btn ${statusFilter === "ready-for-pickup" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => handleStatusFilterChange("ready-for-pickup")}
                  >
                    Ready
                  </button>
                  <button 
                    className={`btn ${statusFilter === "delivered" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => handleStatusFilterChange("delivered")}
                  >
                    Delivered
                  </button>
                  <button 
                    className={`btn ${statusFilter === "cancelled" ? "btn-secondary" : "btn-outline-secondary"}`}
                    onClick={() => handleStatusFilterChange("cancelled")}
                  >
                    Cancelled
                  </button>
                  <button 
                    className={`btn ${statusFilter === "info-requested" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handleStatusFilterChange("info-requested")}
                  >
                    Info Requested
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                Priority Filter
              </div>
              <div className="card-body">
                <div className="btn-group">
                  <button 
                    className={`btn ${priorityFilter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => handlePriorityFilterChange("all")}
                  >
                    All
                  </button>
                  <button 
                    className={`btn ${priorityFilter === "normal" ? "btn-secondary" : "btn-outline-secondary"}`}
                    onClick={() => handlePriorityFilterChange("normal")}
                  >
                    Normal
                  </button>
                  <button 
                    className={`btn ${priorityFilter === "urgent" ? "btn-warning" : "btn-outline-warning"}`}
                    onClick={() => handlePriorityFilterChange("urgent")}
                  >
                    Urgent
                  </button>
                  <button 
                    className={`btn ${priorityFilter === "emergency" ? "btn-danger" : "btn-outline-danger"}`}
                    onClick={() => handlePriorityFilterChange("emergency")}
                  >
                    Emergency
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          {user && user.role === "Hospital Admin" 
            ? `Showing ${filteredRequests.length} of your blood requests`
            : `Showing ${filteredRequests.length} blood requests`
          }
          {statusFilter !== "all" && ` with status: ${statusFilter}`}
          {priorityFilter !== "all" && ` and priority: ${priorityFilter}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        <BloodRequestTable
          bloodRequests={paginatedRequests}
          sortColumn={sortColumn}
          onSort={handleSort}
          onDelete={handleDelete}
          onAccept={handleAccept}
          onReject={handleReject}
          onForward={handleForward}
          onUpdateStatus={handleUpdateStatus}
          onPartialFulfill={handlePartialFulfill}
          onCancel={handleCancel}
          onRequestInfo={handleRequestInfo}
          onProvideInfo={handleProvideInfo}
          ref={tableRef}
        />
        <Pagination
          itemsCount={filteredRequests.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default BloodRequests;
