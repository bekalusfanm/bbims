import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getBloodRequests } from "../services/bloodRequestService";
import { toast } from "react-toastify";
import { Pagination } from "./common/pagination";

const RequestStatus = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get("status") || "all";

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc"
  });

  // Statuses and their display classes - using lowercase to match the database values
  const statusOptions = [
    { value: "all", label: "All Requests" },
    { value: "pending", label: "Pending", class: "bg-warning text-dark" },
    { value: "approved", label: "Approved", class: "bg-success text-white" },
    { value: "completed", label: "Completed", class: "bg-info text-white" },
    { value: "rejected", label: "Rejected", class: "bg-danger text-white" },
    { value: "cancelled", label: "Cancelled", class: "bg-secondary text-white" }
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, selectedStatus, searchTerm, sortConfig]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await getBloodRequests();
      setRequests(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blood requests:", error);
      toast.error("Failed to load blood requests");
      setLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(
        (request) => request.status && request.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          (request._id && String(request._id).toLowerCase().includes(lowercaseTerm)) ||
          (request.bloodType && request.bloodType.toLowerCase().includes(lowercaseTerm)) ||
          (request.hospitalName && request.hospitalName.toLowerCase().includes(lowercaseTerm))
      );
    }

    // Sort the requests
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle missing values
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date sorting for createdAt and updatedAt
        if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
          // Handle MongoDB date format ($date property)
          if (typeof aValue === 'object' && aValue.$date) {
            aValue = new Date(aValue.$date);
          } else {
            aValue = new Date(aValue);
          }
          
          if (typeof bValue === 'object' && bValue.$date) {
            bValue = new Date(bValue.$date);
          } else {
            bValue = new Date(bValue);
          }
        }

        // Handle string sorting
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Handle MongoDB ObjectId sorting
        if (sortConfig.key === "_id") {
          // If _id is an object with $oid
          if (typeof aValue === 'object' && aValue.$oid) {
            aValue = aValue.$oid;
          }
          if (typeof bValue === 'object' && bValue.$oid) {
            bValue = bValue.$oid;
          }
          
          aValue = String(aValue);
          bValue = String(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    
    // Handle MongoDB date format
    if (typeof dateValue === 'object' && dateValue.$date) {
      dateValue = dateValue.$date;
    }
    
    const options = { year: "numeric", month: "short", day: "numeric" };
    try {
      return new Date(dateValue).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const getDisplayId = (idValue) => {
    if (!idValue) return "N/A";
    
    // Handle MongoDB ObjectId format
    if (typeof idValue === 'object' && idValue.$oid) {
      return idValue.$oid.substr(-6);
    }
    
    return String(idValue).substr(-6);
  };

  const getStatusClass = (status) => {
    if (!status) return "";
    
    const statusOption = statusOptions.find(
      (option) => option.value === status.toLowerCase()
    );
    return statusOption ? statusOption.class : "";
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading request data...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Blood Request Status</h2>
            <Link to="/blood-request/new" className="btn btn-primary">
              <i className="fas fa-plus-circle me-2"></i>New Request
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="status-filters d-flex flex-wrap">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                className={`btn me-2 mb-2 ${
                  selectedStatus === status.value
                    ? status.class || "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => handleStatusChange(status.value)}
              >
                {status.label}
                {selectedStatus === status.value && (
                  <span className="ms-2 badge bg-light text-dark">
                    {filteredRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, blood type, or hospital name..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button className="btn btn-outline-secondary" type="button">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              {filteredRequests.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th
                          className="sortable"
                          onClick={() => handleSort("_id")}
                        >
                          Request ID {getSortIndicator("_id")}
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("createdAt")}
                        >
                          Date {getSortIndicator("createdAt")}
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("bloodType")}
                        >
                          Blood Type {getSortIndicator("bloodType")}
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("quantity")}
                        >
                          Quantity {getSortIndicator("quantity")}
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("hospitalName")}
                        >
                          Hospital {getSortIndicator("hospitalName")}
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort("status")}
                        >
                          Status {getSortIndicator("status")}
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((request) => (
                        <tr key={request._id.$oid || request._id}>
                          <td>#{getDisplayId(request._id)}</td>
                          <td>{formatDate(request.createdAt || request.updatedAt)}</td>
                          <td>{request.bloodType}</td>
                          <td>{request.quantity} units</td>
                          <td>{request.hospitalName}</td>
                          <td>
                            <span className={`badge ${getStatusClass(request.status)}`}>
                              {request.status || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/blood-request/${request._id.$oid || request._id}`}
                              className="btn btn-sm btn-outline-info me-2"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            {request.status === "pending" && (
                              <Link
                                to={`/blood-request/${request._id.$oid || request._id}`}
                                className="btn btn-sm btn-outline-primary me-2"
                                title="Edit Request"
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-search fa-3x mb-3 text-muted"></i>
                  <h4>No requests found</h4>
                  <p className="text-muted">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : selectedStatus !== "all"
                      ? `No ${selectedStatus} requests found`
                      : "No blood requests found"}
                  </p>
                  <Link to="/blood-request/new" className="btn btn-primary mt-3">
                    Create New Request
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {filteredRequests.length > itemsPerPage && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination
                    itemsCount={filteredRequests.length}
                    pageSize={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Status Legend</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-2">
                  <span className="badge bg-warning text-dark me-2">Pending</span>
                  <span>Request is being reviewed</span>
                </div>
                <div className="col-md-3 mb-2">
                  <span className="badge bg-success me-2">Approved</span>
                  <span>Request has been approved</span>
                </div>
                <div className="col-md-3 mb-2">
                  <span className="badge bg-info me-2">Completed</span>
                  <span>Blood has been delivered</span>
                </div>
                <div className="col-md-3 mb-2">
                  <span className="badge bg-danger me-2">Rejected</span>
                  <span>Request was denied</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestStatus; 