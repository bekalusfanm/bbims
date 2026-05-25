import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../services/userService';
import inventoryService from '../../services/inventoryService';
import donorService from '../../services/donorService';
import './dashboard.css'; // We'll create this CSS file next

const AdminDashboard = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    staffCount: 0,
    donorsCount: 0,
    recentDonations: 0,
    inventoryCount: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [staffMembers, setStaffMembers] = useState([]);
  const [branchInventory, setBranchInventory] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [branchId, setBranchId] = useState('');

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
          setError('User session not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Set branch ID from current user
        setBranchId(currentUser.branchId || '');
        
        // Load staff members
        const users = await userService.getUsersByBranch(currentUser.branchId);
        const staffOnly = users.filter(user => user.role === 'Staff Member');
        setStaffMembers(staffOnly);
        
        // Load inventory
        const inventory = await inventoryService.getAllInventory();
        const branchItems = currentUser.branchId 
          ? inventory.filter(item => item.branchId === currentUser.branchId)
          : inventory;
        setBranchInventory(branchItems);
        
        // Load donations
        const donorReport = await donorService.getDonorReport(currentUser.branchId, 'month');
        setRecentDonations(donorReport.slice(0, 10)); // Get last 10 donations
        
        // Calculate stats
        setStats({
          staffCount: staffOnly.length,
          donorsCount: await countDonors(currentUser.branchId),
          recentDonations: donorReport.length,
          inventoryCount: countInventoryTotal(branchItems),
        });
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // Helper functions
  const countDonors = async (branchId) => {
    try {
      const donors = await donorService.getAllDonors();
      return branchId ? donors.filter(donor => donor.branchId === branchId).length : donors.length;
    } catch (error) {
      console.error('Error counting donors:', error);
      return 0;
    }
  };
  
  const countInventoryTotal = (inventory) => {
    return inventory.reduce((total, item) => total + (item.quantity || 0), 0);
  };
  
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard data...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col">
          <h2>Branch Admin Dashboard</h2>
          <p className="text-muted">Manage your branch operations and monitor key metrics</p>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Branch Admin Role:</strong> As a Branch Admin, your role is to oversee branch operations, manage staff, and monitor inventory levels. 
            For direct operations like donor registration and inventory updates, please delegate to appropriate staff members.
          </div>
        </div>
      </div>
      
      {/* Statistics Overview */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100 bg-primary text-white">
            <div className="card-body text-center">
              <i className="fas fa-user-md fa-3x mb-3"></i>
              <h2>{stats.staffCount}</h2>
              <p>Staff Members</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100 bg-warning text-white">
            <div className="card-body text-center">
              <i className="fas fa-users fa-3x mb-3"></i>
              <h2>{stats.donorsCount}</h2>
              <p>Registered Donors</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100 bg-success text-white">
            <div className="card-body text-center">
              <i className="fas fa-calendar-check fa-3x mb-3"></i>
              <h2>{stats.recentDonations}</h2>
              <p>Recent Donations</p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-4">
          <div className="card h-100 bg-info text-white">
            <div className="card-body text-center">
              <i className="fas fa-tint fa-3x mb-3"></i>
              <h2>{stats.inventoryCount}</h2>
              <p>Blood Units Available</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <Link to="/users" className="btn btn-outline-primary w-100">
                    <i className="fas fa-users me-2"></i>Manage Staff
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/inventory" className="btn btn-outline-success w-100">
                    <i className="fas fa-box me-2"></i>Manage Inventory
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/reports" className="btn btn-outline-danger w-100">
                    <i className="fas fa-chart-pie me-2"></i>Reports & Analytics
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/donors" className="btn btn-outline-warning w-100">
                    <i className="fas fa-user-friends me-2"></i>View Donors
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Tabs */}
      <ul className="nav nav-tabs mb-4" id="adminTabs" role="tablist">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => handleTabChange('inventory')}
          >
            Inventory
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => handleTabChange('staff')}
          >
            Staff
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            Reports
          </button>
        </li>
      </ul>
      
      <div className="tab-content" id="adminTabsContent">
        {/* Overview Tab */}
        <div className={`tab-pane fade ${activeTab === 'overview' ? 'show active' : ''}`} id="overview" role="tabpanel">
          <div className="row">
            {/* Branch Performance Card */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><i className="fas fa-hospital mr-2"></i> Branch Performance</span>
                  <div>
                    <button className="btn btn-sm btn-outline-primary">Export Data</button>
                  </div>
                </div>
                <div className="card-body">
                  <h5 className="card-title">Branch Activity Summary</h5>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Donation Target Completion</span>
                      <span>78%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: '78%' }} aria-valuenow="78" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Inventory Management</span>
                      <span>92%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-success" role="progressbar" style={{ width: '92%' }} aria-valuenow="92" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Staff Utilization</span>
                      <span>85%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-info" role="progressbar" style={{ width: '85%' }} aria-valuenow="85" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Request Fulfillment Rate</span>
                      <span>95%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-warning" role="progressbar" style={{ width: '95%' }} aria-valuenow="95" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-3">
                    <i className="fas fa-info-circle mr-2"></i> Branch performance is calculated based on the last 30 days of activity.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Critical Alerts Card */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-danger text-white">
                  <i className="fas fa-exclamation-circle mr-2"></i> Critical Alerts
                </div>
                <div className="card-body">
                  {branchInventory.filter(item => item.quantity <= 5).length > 0 ? (
                    <div className="alert alert-danger">
                      <h5><i className="fas fa-tint mr-2"></i> Critical Blood Supply</h5>
                      <p>{branchInventory.filter(item => item.quantity <= 5).length} blood types are in critical supply. 
                        <Link to="#inventory" onClick={() => handleTabChange('inventory')} className="alert-link ml-1">View details</Link>
                      </p>
                    </div>
                  ) : (
                    <div className="alert alert-success">
                      <h5><i className="fas fa-tint mr-2"></i> Blood Supply</h5>
                      <p>All blood types are at adequate levels.</p>
                    </div>
                  )}
                  
                  {branchInventory.filter(item => {
                    const expiryDate = new Date(item.expiryDate || new Date());
                    const today = new Date();
                    const diffTime = expiryDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  }).length > 0 ? (
                    <div className="alert alert-warning mt-3">
                      <h5><i className="fas fa-clock mr-2"></i> Expiring Blood Units</h5>
                      <p>Some blood units will expire within 7 days. Please prioritize their use.</p>
                    </div>
                  ) : null}
                  
                  <div className="alert alert-secondary mt-3">
                    <h5><i className="fas fa-calendar-alt mr-2"></i> Upcoming Events</h5>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2"><i className="fas fa-angle-right mr-2"></i> Staff Meeting - Tomorrow, 9:00 AM</li>
                      <li className="mb-2"><i className="fas fa-angle-right mr-2"></i> Inventory Audit - Friday, 2:00 PM</li>
                      <li><i className="fas fa-angle-right mr-2"></i> Blood Donation Camp - Next Monday</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Staff Overview */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><i className="fas fa-user-md mr-2"></i> Staff Overview</span>
                  <Link to="/users">
                    <button className="btn btn-sm btn-outline-primary">Manage Staff</button>
                  </Link>
                </div>
                <div className="card-body">
                  {staffMembers.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Specialization</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffMembers.slice(0, 5).map(staff => (
                            <tr key={staff._id}>
                              <td>{staff.name}</td>
                              <td>{staff.employmentInfo && staff.employmentInfo.specialization || 'N/A'}</td>
                              <td><span className="badge bg-success">Active</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info">No staff members found.</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <i className="fas fa-history mr-2"></i> Recent Branch Activity
                </div>
                <div className="card-body">
                  <div className="activity-timeline">
                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-primary text-white rounded-circle mr-3 p-2">
                        <i className="fas fa-tint"></i>
                      </div>
                      <div className="activity-content">
                        <div className="font-weight-bold">Blood donation received</div>
                        <div className="text-muted small">A+ blood type, 450ml - 2 hours ago</div>
                      </div>
                    </div>
                    
                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-success text-white rounded-circle mr-3 p-2">
                        <i className="fas fa-user-plus"></i>
                      </div>
                      <div className="activity-content">
                        <div className="font-weight-bold">Staff activity reported</div>
                        <div className="text-muted small">4 staff members active today - 4 hours ago</div>
                      </div>
                    </div>
                    
                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-warning text-white rounded-circle mr-3 p-2">
                        <i className="fas fa-hospital"></i>
                      </div>
                      <div className="activity-content">
                        <div className="font-weight-bold">Blood request fulfilled</div>
                        <div className="text-muted small">City Hospital - 5 hours ago</div>
                      </div>
                    </div>
                    
                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-info text-white rounded-circle mr-3 p-2">
                        <i className="fas fa-clipboard-check"></i>
                      </div>
                      <div className="activity-content">
                        <div className="font-weight-bold">Inventory updated</div>
                        <div className="text-muted small">by Dr. Michael Stevens - Yesterday</div>
                      </div>
                    </div>
                    
                    <div className="activity-item d-flex">
                      <div className="activity-icon bg-secondary text-white rounded-circle mr-3 p-2">
                        <i className="fas fa-user-md"></i>
                      </div>
                      <div className="activity-content">
                        <div className="font-weight-bold">Staff meeting completed</div>
                        <div className="text-muted small">5 staff members attended - Yesterday</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Inventory Tab */}
        <div className={`tab-pane fade ${activeTab === 'inventory' ? 'show active' : ''}`} id="inventory" role="tabpanel">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span><i className="fas fa-tint mr-2"></i> Blood Inventory Status</span>
              <div>
                <Link to="/inventory">
                  <button className="btn btn-sm btn-outline-primary">Monitor Inventory</button>
                </Link>
              </div>
            </div>
            <div className="card-body">
              <p className="mb-3">
                <i className="fas fa-info-circle mr-2"></i> 
                As a Branch Admin, you can monitor inventory levels and alert staff when levels are critical. 
                Staff members are responsible for updating inventory records.
              </p>
              
              {branchInventory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Blood Type</th>
                        <th>Units Available</th>
                        <th>Last Updated</th>
                        <th>Expiry Dates</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchInventory.map((item, index) => (
                        <tr key={index}>
                          <td>{item.bloodType}</td>
                          <td>{item.quantity}</td>
                          <td>{new Date(item.updatedAt || new Date()).toLocaleDateString()}</td>
                          <td>{new Date(item.expiryDate || new Date()).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${item.quantity > 20 ? 'bg-success' : item.quantity > 5 ? 'bg-warning' : 'bg-danger'}`}>
                              {item.quantity > 20 ? 'Adequate' : item.quantity > 5 ? 'Low' : 'Critical'}
                            </span>
                          </td>
                          <td>
                            <Link to={`/inventory/${item._id}`}>
                              <button className="btn btn-sm btn-outline-primary">View Details</button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">No inventory items found.</div>
              )}
            </div>
          </div>
          
          {/* Critical Inventory Alert */}
          <div className="card mt-4">
            <div className="card-header bg-warning text-dark">
              <i className="fas fa-exclamation-triangle mr-2"></i> Critical Inventory Alerts
            </div>
            <div className="card-body">
              {branchInventory.filter(item => item.quantity <= 5).length > 0 ? (
                <div>
                  <p>The following blood types are in critical supply. Please notify staff members to prioritize collection:</p>
                  <ul className="list-group">
                    {branchInventory
                      .filter(item => item.quantity <= 5)
                      .map((item, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>
                            <strong>{item.bloodType}</strong> - Only {item.quantity} units available
                          </span>
                          <span className="badge bg-danger">Critical</span>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : (
                <div className="alert alert-success">
                  <i className="fas fa-check-circle mr-2"></i> No critical inventory levels at this time.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Staff Tab */}
        <div className={`tab-pane fade ${activeTab === 'staff' ? 'show active' : ''}`} id="staff" role="tabpanel">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span><i className="fas fa-user-md mr-2"></i> Staff Management</span>
              <div>
                <Link to="/users">
                  <button className="btn btn-sm btn-outline-primary">View All Staff</button>
                </Link>
                <Link to="/register" className="ml-2">
                  <button className="btn btn-sm btn-outline-success">Add Staff</button>
                </Link>
              </div>
            </div>
            <div className="card-body">
              {staffMembers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Specialization</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffMembers.map(staff => (
                        <tr key={staff._id}>
                          <td>{staff.name}</td>
                          <td>{staff.email}</td>
                          <td>{staff.contactDetails && staff.contactDetails.phone || 'N/A'}</td>
                          <td>{staff.employmentInfo && staff.employmentInfo.specialization || 'N/A'}</td>
                          <td>{staff.employmentInfo && staff.employmentInfo.joinDate ? new Date(staff.employmentInfo.joinDate).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <Link to={`/users/${staff._id}`} className="mr-2">
                              <button className="btn btn-sm btn-outline-primary">View</button>
                            </Link>
                            <Link to={`/register/${staff._id}`}>
                              <button className="btn btn-sm btn-outline-success">Edit</button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">No staff members found.</div>
              )}
            </div>
          </div>
          
          {/* Staff Performance */}
          <div className="card mt-4">
            <div className="card-header">
              <i className="fas fa-chart-bar mr-2"></i> Staff Performance Metrics
            </div>
            <div className="card-body">
              <p className="mb-3">Staff activity summary for the current month:</p>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Donors Registered</th>
                      <th>Donations Processed</th>
                      <th>Inventory Updates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMembers.slice(0, 5).map((staff, index) => (
                      <tr key={staff._id}>
                        <td>{staff.name}</td>
                        <td>{Math.floor(Math.random() * 15)}</td>
                        <td>{Math.floor(Math.random() * 20)}</td>
                        <td>{Math.floor(Math.random() * 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted mt-2">
                <small>* Performance metrics are updated daily.</small>
              </p>
            </div>
          </div>
        </div>
        
        {/* Reports Tab */}
        <div className={`tab-pane fade ${activeTab === 'reports' ? 'show active' : ''}`} id="reports" role="tabpanel">
          <div className="card">
            <div className="card-header">
              <span><i className="fas fa-clipboard-list mr-2"></i> Branch Reports & Analytics</span>
            </div>
            <div className="card-body">
              <p className="mb-3">
                <i className="fas fa-info-circle mr-2"></i> 
                As a Branch Admin, you can generate reports to monitor branch performance, analyze operations, 
                and make informed decisions. These reports can be shared with your team or headquarters.
              </p>
              
              <div className="row">
                <div className="col-md-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-tint fa-3x mb-3 text-danger"></i>
                      <h4>Inventory Report</h4>
                      <p>Monitor blood inventory levels and status</p>
                      <Link to="/reports?type=inventory">
                        <button className="btn btn-outline-primary">Generate Report</button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-users fa-3x mb-3 text-primary"></i>
                      <h4>Donor Report</h4>
                      <p>Analyze donor statistics and trends</p>
                      <Link to="/reports?type=donors">
                        <button className="btn btn-outline-primary">Generate Report</button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4 mb-4">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-chart-line fa-3x mb-3 text-success"></i>
                      <h4>Blood Type Distribution</h4>
                      <p>View distribution of blood types in inventory</p>
                      <Link to="/reports?type=bloodType">
                        <button className="btn btn-outline-primary">Generate Report</button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row mt-3">
                <div className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-user-md fa-3x mb-3 text-info"></i>
                      <h4>Staff Activity Report</h4>
                      <p>Track staff performance and productivity</p>
                      <Link to="/reports?type=staff">
                        <button className="btn btn-outline-primary">Generate Report</button>
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-hospital fa-3x mb-3 text-secondary"></i>
                      <h4>Branch Summary Report</h4>
                      <p>Complete overview of branch operations</p>
                      <Link to="/reports?type=branch">
                        <button className="btn btn-outline-primary">Generate Report</button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card mt-4">
            <div className="card-header">
              <i className="fas fa-download mr-2"></i> Scheduled Reports
            </div>
            <div className="card-body">
              <p>Configure automated reports to be delivered to your email:</p>
              <form>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <select className="form-control" aria-label="Report type">
                      <option>Daily Inventory Summary</option>
                      <option>Weekly Donor Activity</option>
                      <option>Monthly Branch Performance</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select className="form-control" aria-label="Frequency">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <button type="button" className="btn btn-primary w-100">Schedule Report</button>
                  </div>
                </div>
              </form>
              <div className="alert alert-info mt-3">
                <small><i className="fas fa-info-circle mr-1"></i> This is a preview feature. Automated reports will be available in the next update.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 