import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBranches } from "../services/branchService";
import { getDonors } from "../services/donorService";
import { getBloodBags } from "../services/inventoryService";
import { getBloodRequests } from "../services/bloodRequestService";
import { toast } from "react-toastify";
import { useUser } from "../context/userContext";

const SuperAdminHome = () => {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [stats, setStats] = useState({
    branches: [],
    donors: [],
    inventory: [],
    totalBranches: 0,
    totalDonors: 0,
    totalBloodBags: 0,
    bloodTypeDistribution: {},
    branchPerformance: []
  });

  useEffect(() => {
    if (user && user.role === "Super Admin") {
      fetchData();
      fetchBloodRequests();
      
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        fetchData();
        fetchBloodRequests();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      toast.error("You don't have permission to access this page");
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [branches, donors, inventory] = await Promise.all([
        getAllBranches(),
        getDonors(),
        getBloodBags()
      ]);

      // Process data for stats
      const bloodTypeDistribution = calculateBloodTypeDistribution(inventory);
      const branchPerformance = calculateBranchPerformance(branches, donors, inventory);
      
      setStats({
        branches,
        donors,
        inventory,
        totalBranches: branches.length,
        totalDonors: donors.length,
        totalBloodBags: inventory.length,
        bloodTypeDistribution,
        branchPerformance
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodRequests = async () => {
    try {
      const response = await getBloodRequests();
      if (response && response.data) {
        setBloodRequests(response.data);
      }
    } catch (error) {
      console.error("Error fetching blood requests:", error);
    }
  };

  const calculateBloodTypeDistribution = (inventory) => {
    const distribution = {};
    
    inventory.forEach(bag => {
      const type = bag.bloodType;
      if (!distribution[type]) {
        distribution[type] = 0;
      }
      distribution[type]++;
    });
    
    return distribution;
  };

  const calculateBranchPerformance = (branches, donors, inventory) => {
    const performance = [];
    
    branches.forEach(branch => {
      const branchDonors = donors.filter(donor => donor.branchId === branch._id);
      const branchInventory = inventory.filter(bag => bag.branchId === branch._id);
      
      performance.push({
        branchId: branch._id,
        name: branch.name,
        location: branch.location,
        donorCount: branchDonors.length,
        inventoryCount: branchInventory.length,
        // Calculate utilization as a percentage of the branch's contribution to the overall system
        utilization: inventory.length > 0 ? (branchInventory.length / inventory.length) * 100 : 0
      });
    });
    
    // Sort by inventory count (descending)
    return performance.sort((a, b) => b.inventoryCount - a.inventoryCount);
  };

  // Create color variants for blood types
  const getProgressColor = (type) => {
    const colorMap = {
      'A': 'bg-danger',
      'B': 'bg-primary',
      'AB': 'bg-success',
      'O': 'bg-warning'
    };
    return colorMap[type] || 'bg-secondary';
  };

  if (loading) {
    return <div className="text-center mt-5"><p>Loading dashboard data...</p></div>;
  }

  return (
    <>
      <div className="container mt-4">
        <h1 className="mb-4">Super Admin Dashboard</h1>
        
        {/* Blood Requests Alert */}
        {bloodRequests.filter(req => req.status === "forwarded").length > 0 && (
          <div className="alert alert-warning mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Attention Required:</strong> You have {bloodRequests.filter(req => req.status === "forwarded").length} forwarded blood requests that need your review.
              </div>
              <Link to="/superadmin-requests" className="btn btn-primary btn-sm">
                Review Requests
              </Link>
            </div>
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card mb-3 bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Branches</h5>
                <p className="card-text" style={{ fontSize: '2rem' }}>{stats.totalBranches}</p>
                <a href="/branches" className="btn btn-light btn-sm">Manage Branches</a>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card mb-3 bg-success text-white">
              <div className="card-body">
                <h5 className="card-title">Donors</h5>
                <p className="card-text" style={{ fontSize: '2rem' }}>{stats.totalDonors}</p>
                <a href="/donors" className="btn btn-light btn-sm">View Donors</a>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card mb-3 bg-danger text-white">
              <div className="card-body">
                <h5 className="card-title">Blood Inventory</h5>
                <p className="card-text" style={{ fontSize: '2rem' }}>{stats.totalBloodBags}</p>
                <a href="/inventory" className="btn btn-light btn-sm">View Inventory</a>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card mb-3 bg-info text-white">
              <div className="card-body">
                <h5 className="card-title">Blood Requests</h5>
                <p className="card-text" style={{ fontSize: '2rem' }}>
                  {bloodRequests.filter(req => req.status === "forwarded").length}
                  <small className="ms-2" style={{ fontSize: '1rem' }}>Forwarded</small>
                </p>
                <Link to="/superadmin-requests" className="btn btn-light btn-sm">
                  Manage Requests
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <Link to="/branches" className="btn btn-outline-primary w-100">
                      <i className="fas fa-building me-2"></i>Manage Branches
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/users" className="btn btn-outline-secondary w-100">
                      <i className="fas fa-users me-2"></i>Manage Users
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/reports" className="btn btn-outline-danger w-100">
                      <i className="fas fa-chart-pie me-2"></i>Reports & Analytics
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/superadmin-requests" className={`btn ${bloodRequests.filter(req => req.status === "forwarded").length > 0 ? "btn-danger" : "btn-outline-info"} w-100`}>
                      <i className="fas fa-tint me-2"></i>Blood Requests
                      {bloodRequests.filter(req => req.status === "forwarded").length > 0 && (
                        <span className="badge bg-white text-danger ms-2">
                          {bloodRequests.filter(req => req.status === "forwarded").length}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Blood Type Distribution</div>
              <div className="card-body">
                {Object.keys(stats.bloodTypeDistribution).length > 0 ? (
                  <div className="blood-type-chart">
                    {Object.entries(stats.bloodTypeDistribution).map(([type, count]) => {
                      const percentage = (count / stats.totalBloodBags) * 100;
                      return (
                        <div key={type} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span><strong>Type {type}</strong></span>
                            <span>{count} bags ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="progress" style={{ height: '25px' }}>
                            <div 
                              className={`progress-bar ${getProgressColor(type)}`}
                              role="progressbar" 
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center">No blood bag data available</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">Branch Performance</div>
              <div className="card-body">
                {stats.branchPerformance.length > 0 ? (
                  <div className="branch-performance-chart">
                    {stats.branchPerformance.slice(0, 5).map((branch) => (
                      <div key={branch.branchId} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span><strong>{branch.name}</strong></span>
                          <span>{branch.inventoryCount} bags</span>
                        </div>
                        <div className="progress" style={{ height: '25px' }}>
                          <div 
                            className="progress-bar bg-info" 
                            role="progressbar" 
                            style={{ width: `${branch.utilization}%` }}
                            aria-valuenow={branch.utilization} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center">No branch performance data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Performance Details */}
      <div className="container">
        <div className="card mb-4">
          <div className="card-header">Branch Performance Details</div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Location</th>
                    <th>Donors</th>
                    <th>Blood Bags</th>
                    <th>Utilization (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.branchPerformance.map(branch => (
                    <tr key={branch.branchId}>
                      <td>{branch.name}</td>
                      <td>{branch.location}</td>
                      <td>{branch.donorCount}</td>
                      <td>{branch.inventoryCount}</td>
                      <td>{branch.utilization.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Additional Quick Actions */}
        <div className="card">
          <div className="card-header">Additional Actions</div>
          <div className="card-body">
            <div className="row">
              <div className="col-12 col-md-4 mb-2">
                <Link to="/branches/new" className="btn btn-outline-primary w-100">Create New Branch</Link>
              </div>
              <div className="col-12 col-md-4 mb-2">
                <Link to="/users" className="btn btn-outline-secondary w-100">Manage Users</Link>
              </div>
              <div className="col-12 col-md-4 mb-2">
                <Link to="/blood-request" className="btn btn-outline-danger w-100">View Blood Requests</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminHome; 