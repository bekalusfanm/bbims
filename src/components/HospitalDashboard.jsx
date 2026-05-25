import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBloodRequests } from "../services/bloodRequestService";
import { toast } from "react-toastify";
import "../styles/dashboard.css";

const HospitalDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    forwarded: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [bloodTypeData, setBloodTypeData] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchData();
    // Set up polling for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getBloodRequests();
      
      setRequests(data);
      
      // Calculate statistics
      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === "pending").length,
        approved: data.filter(r => r.status === "approved").length,
        completed: data.filter(r => r.status === "completed").length,
        rejected: data.filter(r => r.status === "rejected").length,
        forwarded: data.filter(r => r.status === "forwarded").length
      };
      setStats(stats);
      
      // Get recent requests (last 5)
      const sortedRequests = [...data].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.updatedAt || 0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.updatedAt || 0);
        return dateB - dateA;
      });
      setRecentRequests(sortedRequests.slice(0, 5));

      // Get recent activity (status changes)
      const activity = data
        .filter(request => request.updatedAt)
        .map(request => ({
          id: request._id,
          type: 'status_change',
          status: request.status,
          date: request.updatedAt,
          bloodType: request.bloodType,
          quantity: request.quantity
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentActivity(activity);
      
      // Count blood types
      const bloodTypes = {};
      data.forEach(request => {
        bloodTypes[request.bloodType] = (bloodTypes[request.bloodType] || 0) + 1;
      });
      setBloodTypeData(bloodTypes);

      // Check for new notifications
      const newNotifications = data
        .filter(request => {
          const lastCheck = localStorage.getItem(`lastCheck_${request._id}`);
          return !lastCheck || new Date(request.updatedAt) > new Date(lastCheck);
        })
        .map(request => {
          // Save this check time to localStorage
          localStorage.setItem(`lastCheck_${request._id}`, new Date().toISOString());
          
          return {
            id: request._id,
            type: request.status,
            message: `Your blood request for ${request.bloodType} has been ${request.status}`,
            date: request.updatedAt
          };
        });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        newNotifications.forEach(notification => {
          toast.info(notification.message, {
            position: "top-right",
            autoClose: 5000
          });
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "approved": return "text-success";
      case "pending": return "text-warning";
      case "rejected": return "text-danger";
      case "completed": return "text-info";
      default: return "";
    }
  };

  const getDisplayId = (idString) => {
    if (!idString) return "N/A";
    if (typeof idString === 'object' && idString.$oid) {
      return idString.$oid.substr(-6);
    }
    return idString.substr(-6);
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading dashboard data...</p>
            <div className="progress mt-3">
              <div className="progress-bar progress-bar-striped progress-bar-animated" 
                   role="progressbar" 
                   style={{ width: '100%' }} 
                   aria-valuenow="100" 
                   aria-valuemin="0" 
                   aria-valuemax="100">
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Hospital Dashboard</h2>
              <p className="text-muted mb-0">
                Manage your hospital's blood requests and monitor their status
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/blood-request/new" className="btn btn-primary">
                <i className="fas fa-plus-circle me-2"></i>New Blood Request
              </Link>
              <Link to="/blood-request" className="btn btn-outline-primary">
                <i className="fas fa-list me-2"></i>View All Requests
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <Link to="/blood-request/new" className="btn btn-outline-primary w-100">
                    <i className="fas fa-plus-circle me-2"></i>New Request
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/blood-request" className="btn btn-outline-info w-100">
                    <i className="fas fa-search me-2"></i>Search Requests
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/profile" className="btn btn-outline-secondary w-100">
                    <i className="fas fa-user-edit me-2"></i>Update Profile
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/settings" className="btn btn-outline-warning w-100">
                    <i className="fas fa-cog me-2"></i>Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Updates Alert */}
      {(stats.approved > 0 || stats.rejected > 0 || stats.forwarded > 0) && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-info">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Request Status Updates:</strong>
                  {stats.approved > 0 && (
                    <span className="badge bg-success ms-2">
                      {stats.approved} Approved
                    </span>
                  )}
                  {stats.rejected > 0 && (
                    <span className="badge bg-danger ms-2">
                      {stats.rejected} Rejected
                    </span>
                  )}
                  {stats.forwarded > 0 && (
                    <span className="badge bg-info ms-2">
                      {stats.forwarded} Forwarded
                    </span>
                  )}
                </div>
                <Link to="/blood-request" className="btn btn-sm btn-primary">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-2 mb-3">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <h5 className="card-title text-primary">Total</h5>
              <h2 className="mt-3 mb-0">{stats.total}</h2>
              <div className="mt-3">
                <Link to="/blood-request" className="card-link">View all</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-2 mb-3">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <h5 className="card-title text-warning">Pending</h5>
              <h2 className="mt-3 mb-0">{stats.pending}</h2>
              <div className="mt-3">
                <Link to="/blood-request" className="card-link">View</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-2 mb-3">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <h5 className="card-title text-info">Forwarded</h5>
              <h2 className="mt-3 mb-0">{stats.forwarded}</h2>
              <div className="mt-3">
                <Link to="/blood-request" className="card-link">View</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-2 mb-3">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <h5 className="card-title text-success">Approved</h5>
              <h2 className="mt-3 mb-0">{stats.approved}</h2>
              <div className="mt-3">
                <Link to="/blood-request" className="card-link">View</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-2 mb-3">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <h5 className="card-title text-danger">Rejected</h5>
              <h2 className="mt-3 mb-0">{stats.rejected}</h2>
              <div className="mt-3">
                <Link to="/blood-request" className="card-link">View</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-2 mb-3">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <h5 className="card-title text-secondary">Completed</h5>
              <h2 className="mt-3 mb-0">{stats.completed}</h2>
              <div className="mt-3">
                <Link to="/blood-request" className="card-link">View</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Status Breakdown */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Status Changes</h5>
              <Link to="/blood-request" className="btn btn-sm btn-outline-primary">
                View All Requests
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.approved > 0 && (
                      <tr>
                        <td>
                          <span className="badge bg-success">Approved</span>
                        </td>
                        <td>{stats.approved}</td>
                        <td>
                          <Link to="/blood-request" className="btn btn-sm btn-outline-success">
                            View Approved Requests
                          </Link>
                        </td>
                      </tr>
                    )}
                    {stats.forwarded > 0 && (
                      <tr>
                        <td>
                          <span className="badge bg-info">Forwarded</span>
                        </td>
                        <td>{stats.forwarded}</td>
                        <td>
                          <Link to="/blood-request" className="btn btn-sm btn-outline-info">
                            View Forwarded Requests
                          </Link>
                        </td>
                      </tr>
                    )}
                    {stats.rejected > 0 && (
                      <tr>
                        <td>
                          <span className="badge bg-danger">Rejected</span>
                        </td>
                        <td>{stats.rejected}</td>
                        <td>
                          <Link to="/blood-request" className="btn btn-sm btn-outline-danger">
                            View Rejected Requests
                          </Link>
                        </td>
                      </tr>
                    )}
                    {stats.pending > 0 && (
                      <tr>
                        <td>
                          <span className="badge bg-warning">Pending</span>
                        </td>
                        <td>{stats.pending}</td>
                        <td>
                          <Link to="/blood-request" className="btn btn-sm btn-outline-warning">
                            View Pending Requests
                          </Link>
                        </td>
                      </tr>
                    )}
                    {stats.completed > 0 && (
                      <tr>
                        <td>
                          <span className="badge bg-secondary">Completed</span>
                        </td>
                        <td>{stats.completed}</td>
                        <td>
                          <Link to="/blood-request" className="btn btn-sm btn-outline-secondary">
                            View Completed Requests
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Recent Requests */}
      <div className="row">
        {/* Notifications Panel */}
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <h5 className="mb-0">
                <i className="fas fa-bell me-2 text-warning"></i>
                Notifications
                {notifications.length > 0 && (
                  <span className="badge bg-danger ms-2">{notifications.length}</span>
                )}
              </h5>
              {notifications.length > 0 && (
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setNotifications([])}
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="card-body">
              {notifications.length > 0 ? (
                <div className="list-group">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={index} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            <span className={`badge ${
                              notification.type === "approved" ? "bg-success" :
                              notification.type === "rejected" ? "bg-danger" :
                              notification.type === "forwarded" ? "bg-info" : "bg-secondary"
                            } me-2`}>
                              {notification.type.toUpperCase()}
                            </span>
                            {notification.message}
                          </h6>
                          <p className="mb-1 small">
                            Request #{getDisplayId(notification.id)}
                          </p>
                        </div>
                        <small className="text-muted">{formatDate(notification.date)}</small>
                      </div>
                    </div>
                  ))}
                  {notifications.length > 5 && (
                    <div className="text-center mt-3">
                      <button className="btn btn-sm btn-outline-primary">
                        View All ({notifications.length}) Notifications
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted text-center">No new notifications</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {recentActivity.length > 0 ? (
                <div className="list-group">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Request #{getDisplayId(activity.id)}</h6>
                          <p className="mb-1">
                            {activity.bloodType} - {activity.quantity} units
                          </p>
                          <small className="text-muted">
                            Status changed to <span className={getStatusClass(activity.status)}>{activity.status}</span>
                          </small>
                        </div>
                        <small className="text-muted">{formatDate(activity.date)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Requests</h5>
              <Link to="/blood-request" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {recentRequests.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Blood Type</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRequests.map(request => (
                        <tr key={request._id}>
                          <td>#{getDisplayId(request._id)}</td>
                          <td>{request.bloodType}</td>
                          <td>{request.quantity}</td>
                          <td>{formatDate(request.createdAt)}</td>
                          <td>
                            <span className={`badge ${
                              request.status === "approved" ? "bg-success" :
                              request.status === "pending" ? "bg-warning" :
                              request.status === "rejected" ? "bg-danger" :
                              request.status === "forwarded" ? "bg-info" : "bg-secondary"
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <Link 
                              to={`/blood-request/${request._id}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No recent requests</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard; 