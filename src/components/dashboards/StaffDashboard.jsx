import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../services/userService';
import inventoryService from '../../services/inventoryService';
import donorService from '../../services/donorService';
import './dashboard.css';

const StaffDashboard = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    donorsCount: 0,
    recentDonations: 0,
    inventoryCount: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [branchInventory, setBranchInventory] = useState([]);
  const [donors, setDonors] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          setError('User session not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        setCurrentUser(user);
        
        // Set branch ID from current user
        setBranchId(user.branchId || '');
        
        // Load donors
        const allDonors = await donorService.getAllDonors();
        
        // Process donors to add eligibility status
        const processedDonors = allDonors.map(donor => {
          // Get donor's donation history
          const lastDonation = donor.lastDonation ? new Date(donor.lastDonation) : null;
          const currentDate = new Date();
          
          // Eligibility criteria:
          // 1. Has blood type and rhFactor information
          // 2. Last donation was more than 90 days ago (or never donated)
          // 3. Hemoglobin level is suitable (greater than 12.5)
          // 4. Blood pressure is in normal range
          
          let isEligible = true;
          let eligibilityReasons = [];
          
          // Check last donation date (if exists)
          if (lastDonation) {
            const daysSinceLastDonation = Math.floor((currentDate - lastDonation) / (1000 * 60 * 60 * 24));
            if (daysSinceLastDonation < 90) {
              isEligible = false;
              const daysToWait = 90 - daysSinceLastDonation;
              eligibilityReasons.push(`Last donation was ${daysSinceLastDonation} days ago. Must wait ${daysToWait} more days.`);
            }
          }
          
          // Check hemoglobin level if available
          if (donor.healthInfo && donor.healthInfo.hemoglobinLevel) {
            if (donor.healthInfo.hemoglobinLevel < 12.5) {
              isEligible = false;
              eligibilityReasons.push(`Hemoglobin level (${donor.healthInfo.hemoglobinLevel}) is below 12.5.`);
            }
          }
          
          // Check blood pressure if available
          if (donor.healthInfo && donor.healthInfo.bloodPressure) {
            const { systolic, diastolic } = donor.healthInfo.bloodPressure;
            if (systolic < 90 || systolic > 180 || diastolic < 60 || diastolic > 100) {
              isEligible = false;
              eligibilityReasons.push(`Blood pressure (${systolic}/${diastolic}) is outside normal range.`);
            }
          }
          
          return {
            ...donor,
            name: donor.personalInfo ? donor.personalInfo.name : donor.name,
            bloodType: donor.healthInfo ? 
              `${donor.healthInfo.bloodType}${donor.healthInfo.rhFactor === 'positive' ? '+' : '-'}` : 
              donor.bloodType,
            phone: donor.personalInfo ? donor.personalInfo.phoneNumber : donor.phone,
            eligibleToDonate: isEligible,
            eligibilityReasons: eligibilityReasons.join(' ')
          };
        });
        
        const branchDonors = user.branchId 
          ? processedDonors.filter(donor => donor.branchId === user.branchId)
          : processedDonors;
        setDonors(branchDonors);
        
        // Load inventory
        const inventory = await inventoryService.getAllInventory();
        const branchItems = user.branchId 
          ? inventory.filter(item => item.branchId === user.branchId)
          : inventory;
        setBranchInventory(branchItems);
        
        // Load donation report
        const donorReport = await donorService.getDonorReport(user.branchId, 'month');
        setRecentDonations(donorReport.slice(0, 10)); // Get last 10 donations
        
        // Calculate stats
        setStats({
          donorsCount: branchDonors.length,
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
          <h2>Staff Dashboard</h2>
          <p className="text-muted">Manage your daily operations and blood bank activities</p>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Staff Member Role:</strong> As a Staff Member, you're responsible for donor registration, 
            inventory management, and handling donation procedures. Your focus is on maintaining donor records 
            and ensuring blood inventory is properly tracked. Blood requests and report generation are handled by Branch Admins.
          </div>
        </div>
      </div>
      
      {/* Statistics Overview */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card h-100 bg-warning text-white">
            <div className="card-body text-center">
              <i className="fas fa-users fa-3x mb-3"></i>
              <h2>{stats.donorsCount}</h2>
              <p>Registered Donors</p>
              <Link to="/donors" className="btn btn-sm btn-light mt-2">Manage Donors</Link>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card h-100 bg-success text-white">
            <div className="card-body text-center">
              <i className="fas fa-calendar-check fa-3x mb-3"></i>
              <h2>{stats.recentDonations}</h2>
              <p>Recent Donations</p>
              <Link to="/donors" className="btn btn-sm btn-light mt-2">View Donations</Link>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card h-100 bg-info text-white">
            <div className="card-body text-center">
              <i className="fas fa-tint fa-3x mb-3"></i>
              <h2>{stats.inventoryCount}</h2>
              <p>Blood Units Available</p>
              <Link to="/inventory" className="btn btn-sm btn-light mt-2">Manage Inventory</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Tabs */}
      <ul className="nav nav-tabs mb-4" id="staffTabs" role="tablist">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Tasks
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'donors' ? 'active' : ''}`}
            onClick={() => handleTabChange('donors')}
          >
            Donors
          </button>
        </li>
      </ul>
      
      <div className="tab-content" id="staffTabsContent">
        {/* Overview/Tasks Tab */}
        <div className={`tab-pane fade ${activeTab === 'overview' ? 'show active' : ''}`} id="overview" role="tabpanel">
          <div className="row">
            {/* Quick Actions Card */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <i className="fas fa-tasks mr-2"></i> Quick Actions
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <Link to="/donors/new" className="btn btn-primary btn-block">
                        <i className="fas fa-user-plus mr-2"></i> Register New Donor
                      </Link>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Link to="/inventory/new" className="btn btn-success btn-block">
                        <i className="fas fa-plus-circle mr-2"></i> Add Inventory
                      </Link>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Link to="/inventory" className="btn btn-warning btn-block">
                        <i className="fas fa-list-alt mr-2"></i> View Inventory
                      </Link>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Link to="/donors" className="btn btn-info btn-block">
                        <i className="fas fa-search mr-2"></i> Search Donors
                      </Link>
                    </div>
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
                </div>
              </div>
            </div>
            
            {/* Recent Donations */}
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><i className="fas fa-calendar-check mr-2"></i> Recent Donations</span>
                  <Link to="/donors">
                    <button className="btn btn-sm btn-outline-primary">View All</button>
                  </Link>
                </div>
                <div className="card-body">
                  {recentDonations.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Donor Name</th>
                            <th>Blood Type</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentDonations.slice(0, 5).map((donation, index) => (
                            <tr key={index}>
                              <td>{donation.donorName}</td>
                              <td>{donation.bloodType}</td>
                              <td>{new Date(donation.donationDate).toLocaleDateString()}</td>
                              <td>{donation.amount} mL</td>
                              <td>
                                <Link to={`/donors/view/${donation.donorId}`}>
                                  <button className="btn btn-sm btn-outline-primary">View Donor</button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info">No recent donations found.</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Critical Inventory Alert */}
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-warning text-dark">
                  <i className="fas fa-exclamation-triangle mr-2"></i> Critical Inventory Alerts
                </div>
                <div className="card-body">
                  {branchInventory.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle mr-2"></i> No inventory data available. Please add inventory items.
                      <div className="mt-3">
                        <Link to="/inventory/new">
                          <button className="btn btn-primary">Add New Inventory</button>
                        </Link>
                      </div>
                    </div>
                  ) : branchInventory.filter(item => item.quantity <= 10).length > 0 ? (
                    <div>
                      <p>The following blood types are in low or critical supply:</p>
                      <div className="row">
                        {branchInventory
                          .filter(item => item.quantity <= 10)
                          .map((item, index) => (
                            <div key={index} className="col-md-3 mb-3">
                              <div className={`card ${item.quantity <= 5 ? 'border-danger' : 'border-warning'}`}>
                                <div className={`card-body ${item.quantity <= 5 ? 'bg-danger' : 'bg-warning'} text-white`}>
                                  <h5 className="card-title">{item.bloodType}</h5>
                                  <p className="card-text mb-0">Only {item.quantity} units available</p>
                                  <small>{item.quantity <= 5 ? 'CRITICAL' : 'LOW'}</small>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="mt-3">
                        <Link to="/inventory/new">
                          <button className="btn btn-primary">Add New Inventory</button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-success">
                      <i className="fas fa-check-circle mr-2"></i> All blood types have adequate inventory levels.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Donors Tab */}
        <div className={`tab-pane fade ${activeTab === 'donors' ? 'show active' : ''}`} id="donors" role="tabpanel">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span><i className="fas fa-users mr-2"></i> Donors Management</span>
              <div>
                <Link to="/donors/new">
                  <button className="btn btn-sm btn-success">Register New Donor</button>
                </Link>
              </div>
            </div>
            <div className="card-body">
              {donors.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Blood Type</th>
                        <th>Phone</th>
                        <th>Last Donation</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donors.slice(0, 10).map((donor, index) => (
                        <tr key={index}>
                          <td>{donor.name}</td>
                          <td>{donor.bloodType}</td>
                          <td>{donor.phone}</td>
                          <td>{donor.lastDonation ? new Date(donor.lastDonation).toLocaleDateString() : 'Never'}</td>
                          <td>
                            <div>
                              <span 
                                className={`badge ${donor.eligibleToDonate ? 'bg-success' : 'bg-warning'}`}
                                title={donor.eligibleToDonate ? 'Donor meets all eligibility criteria' : donor.eligibilityReasons}
                                style={{ cursor: 'help' }}
                              >
                                {donor.eligibleToDonate ? 'Eligible' : 'Not Eligible'}
                              </span>
                              
                              {!donor.eligibleToDonate && (
                                <div className="mt-1">
                                  <button 
                                    className="btn btn-sm btn-outline-secondary"
                                    data-toggle="collapse" 
                                    data-target={`#eligibilityReason-${index}`}
                                    aria-expanded="false"
                                    type="button"
                                    style={{ padding: '0 0.4rem', fontSize: '0.7rem' }}
                                  >
                                    <i className="fas fa-info-circle"></i> See reason
                                  </button>
                                  <div className="collapse mt-1" id={`eligibilityReason-${index}`}>
                                    <div className="card card-body py-1 px-2" style={{ fontSize: '0.8rem' }}>
                                      {donor.eligibilityReasons}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Link to={`/donors/view/${donor._id}`} className="mr-2">
                              <button className="btn btn-sm btn-outline-primary">View</button>
                            </Link>
                            <Link to={`/donors/${donor._id}`}>
                              <button className="btn btn-sm btn-outline-success">Edit</button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">No donors found.</div>
              )}
              {donors.length > 10 && (
                <div className="text-center mt-3">
                  <Link to="/donors">
                    <button className="btn btn-primary">View All Donors</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard; 