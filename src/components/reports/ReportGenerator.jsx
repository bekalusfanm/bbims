import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import donorService from '../../services/donorService';
import userService from '../../services/userService';
import bloodRequestService from '../../services/bloodRequestService';
import styled from 'styled-components';
import { toast } from 'react-toastify';

// Styled components
const ReportContainer = styled.div`
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  
  h2 {
    margin: 0;
    color: #343a40;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
`;

const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }
  
  th {
    background-color: #343a40;
    color: white;
  }
  
  tbody tr:nth-of-type(even) {
    background-color: #f8f9fa;
  }
  
  tbody tr:hover {
    background-color: #e9ecef;
  }
`;

const ButtonGroup = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 10px;
`;

const ReportGenerator = ({ history }) => {
  // Parse URL parameters
  const searchParams = new URLSearchParams(history.location.search);
  const reportType = searchParams.get('type') || 'inventory';
  
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("user"));
  
  // State variables
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [branchId, setBranchId] = useState(currentUser && currentUser.branchId ? currentUser.branchId : '');
  const [branches, setBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Load data on component mount
  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Always fetch available branches, regardless of user role
        try {
          const branchesData = await userService.getBranches();
          console.log("Fetched branches for report:", branchesData);
          
          if (Array.isArray(branchesData) && branchesData.length > 0) {
            setBranches(branchesData);
            
            // If current user is Branch Admin, set their branch ID as selected
            if (currentUser && currentUser.role === 'Admin' && currentUser.branchId) {
              console.log("Setting branch ID for Branch Admin:", currentUser.branchId);
              setBranchId(currentUser.branchId);
              
              // For Branch Admin, filter branches list to only show their branch
              if (currentUser.role === 'Admin') {
                const adminBranch = branchesData.find(b => b._id === currentUser.branchId);
                if (adminBranch) {
                  console.log("Filtering branches for Branch Admin to only show:", adminBranch.name);
                }
              }
            }
          } else {
            console.warn("No branches returned from API");
          }
        } catch (branchError) {
          console.error("Error fetching branches:", branchError);
          setError('Failed to load branch data. Some filtering options may be unavailable.');
        }
        
        // Generate report based on type
        await generateReport();
      } catch (error) {
        console.error('Error loading report data:', error);
        setError('Failed to load report data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadReport();
  }, [reportType]);
  
  // Generate report when parameters change, but only if not currently loading
  useEffect(() => {
    // Only regenerate report if we're not in the initial loading state
    // and if timeRange or branchId changed after the initial load
    if (!loading && reportData.length > 0) {
      generateReport();
    }
  }, [timeRange, branchId]);
  
  // Get branch name by ID
  const getBranchName = (branchId) => {
    if (!branchId) return 'All Branches';
    
    // Find branch in the branches array
    const branch = branches.find(b => b._id === branchId);
    
    // If branch is found, return its name
    if (branch && branch.name) {
      return branch.name;
    }
    
    // If branch not found in branches array but user has a branch, try to use that
    if (currentUser && currentUser.branchId === branchId && currentUser.branchName) {
      return currentUser.branchName;
    }
    
    // Fall back to showing branch ID with a indicator that it's an ID
    return `Branch: ${branchId}`;
  };
  
  // Get report title
  const getReportTitleForDisplay = () => {
    let title = '';
    switch (reportType) {
      case 'inventory': title = 'Inventory Report'; break;
      case 'donors': title = 'Donor Activity Report'; break;
      case 'bloodType': title = 'Blood Type Distribution Report'; break;
      case 'staff': title = 'Staff Performance Report'; break;
      case 'branch': title = 'Branch Summary Report'; break;
      case 'bloodRequests': title = 'Blood Requests Report'; break;
      default: title = 'Report';
    }
    
    // Add branch info if applicable
    if (branchId) {
      const branchName = getBranchName(branchId);
      title += ` - ${branchName}`;
    }
    
    return title;
  };
  
  // Helper function to validate authentication
  const validateAuthentication = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in again.");
      toast.error("Authentication required. Please log in again.");
      history.push("/login");
      return false;
    }
    
    if (!currentUser) {
      setError("User information not found. Please log in again.");
      toast.error("User information not found. Please log in again.");
      history.push("/login");
      return false;
    }
    
    const allowedRoles = ['Super Admin', 'Admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      setError(`Unauthorized. Only ${allowedRoles.join(' and ')} can access reports.`);
      toast.error(`Unauthorized. Only ${allowedRoles.join(' and ')} can access reports.`);
      history.push("/unauthorized");
      return false;
    }
    
    return true;
  };
  
  // Helper function to get date range based on selected time range
  const getDateRangeForTimeRange = (range) => {
    const today = new Date();
    const result = { fromDate: null, toDate: today.toISOString().split('T')[0] };
    
    switch (range) {
      case 'week':
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        result.fromDate = lastWeek.toISOString().split('T')[0];
        break;
        
      case 'month':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        result.fromDate = lastMonth.toISOString().split('T')[0];
        break;
        
      case 'year':
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        result.fromDate = lastYear.toISOString().split('T')[0];
        break;
        
      case 'all':
        // Don't set fromDate for "all time" - API will handle this
        result.fromDate = null;
        break;
        
      default:
        const defaultRange = new Date();
        defaultRange.setMonth(defaultRange.getMonth() - 1);
        result.fromDate = defaultRange.toISOString().split('T')[0];
    }
    
    return result;
  };
  
  // Function to generate reports based on type
  const generateReport = async () => {
    // Prevent re-entry if already loading
    if (loading) return;
    
    // Validate authentication before proceeding
    if (!validateAuthentication()) return;
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      let data = [];
      
      console.log(`Generating ${reportType} report with filters:`, {
        branchId, 
        timeRange, 
        statusFilter: reportType === 'bloodRequests' ? statusFilter : undefined,
        priorityFilter: reportType === 'bloodRequests' ? priorityFilter : undefined,
        currentUser: currentUser ? { 
          role: currentUser.role, 
          branchId: currentUser.branchId 
        } : 'not logged in'
      });
      
      switch (reportType) {
        case 'inventory':
          try {
            data = await inventoryService.getInventoryReport(branchId, timeRange);
          } catch (error) {
            console.error("Error fetching inventory report:", error);
            throw new Error(`Failed to fetch inventory data: ${error.message || 'Unknown error'}`);
          }
          break;
          
        case 'donors':
          try {
            data = await donorService.getDonorReport(branchId, timeRange);
          } catch (error) {
            console.error("Error fetching donor report:", error);
            throw new Error(`Failed to fetch donor data: ${error.message || 'Unknown error'}`);
          }
          break;
          
        case 'bloodType':
          try {
            data = await inventoryService.getBloodTypeDistribution(branchId);
          } catch (error) {
            console.error("Error fetching blood type distribution:", error);
            throw new Error(`Failed to fetch blood type distribution: ${error.message || 'Unknown error'}`);
          }
          break;
          
        case 'staff':
          try {
            data = await userService.getStaffPerformance(branchId, timeRange);
          } catch (error) {
            console.error("Error fetching staff performance:", error);
            throw new Error(`Failed to fetch staff performance data: ${error.message || 'Unknown error'}`);
          }
          break;
          
        case 'branch':
          try {
            data = await userService.getBranchSummary(branchId, timeRange);
          } catch (error) {
            console.error("Error fetching branch summary:", error);
            throw new Error(`Failed to fetch branch summary data: ${error.message || 'Unknown error'}`);
          }
          break;
          
        case 'bloodRequests':
          const filters = {};
          
          // Add branchId filter if set, regardless of user role
          if (branchId) {
            filters.branchId = branchId;
          }
          
          if (statusFilter !== 'all') filters.status = statusFilter;
          if (priorityFilter !== 'all') filters.priority = priorityFilter;
          
          // Set date range filters using the utility function
          const dateRange = getDateRangeForTimeRange(timeRange);
          if (dateRange.fromDate) filters.fromDate = dateRange.fromDate;
          if (dateRange.toDate) filters.toDate = dateRange.toDate;
          
          console.log("Calling blood request report service with filters:", filters);
          
          try {
            data = await bloodRequestService.getBloodRequestReport(filters);
            console.log("Received blood request report data:", data);
          } catch (apiError) {
            console.error("API Error fetching blood request data:", apiError);
            
            if (apiError.response) {
              if (apiError.response.status === 404) {
                throw new Error("Blood request report endpoint not found. Please ensure the backend server is running.");
              } else if (apiError.response.status === 401 || apiError.response.status === 403) {
                throw new Error("You don't have permission to access this report. Please check your role or login again.");
              } else {
                throw new Error(`Server error: ${apiError.response.data || apiError.message || 'Unknown error'}`);
              }
            } else {
              throw new Error(`Failed to fetch blood request data: ${apiError.message || 'Connection error'}`);
            }
          }
          break;
          
        default:
          data = await inventoryService.getInventoryReport(branchId, timeRange);
      }
      
      // Make sure we have valid data before setting state
      if (Array.isArray(data)) {
        console.log(`Successfully loaded ${data.length} records for ${reportType} report`);
        setReportData(data);
        if (data.length === 0) {
          setError(`No data available for the selected filters. Try adjusting your filter criteria or check if data exists for the selected time period.`);
        }
      } else {
        console.error("Invalid data format received:", data);
        setReportData([]);
        setError('Received invalid data format from server. Please try again later or contact support if the issue persists.');
      }
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      setError(`${error.message || `Failed to generate ${reportType} report. Unknown error.`}`);
      setReportData([]); // Clear any existing data on error
    } finally {
      setLoading(false);
    }
  };
  
  // Function to export data as CSV
  const exportToCsv = () => {
    // Bail if no data
    if (!reportData || reportData.length === 0) return;
    
    // Get headers from first object
    const headers = Object.keys(reportData[0]);
    
    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...reportData.map(row => 
        headers.map(header => {
          // Handle values with commas by quoting them
          const value = row[header];
          if (value === null || value === undefined) return '';
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Change report type
  const changeReportType = (type) => {
    history.push(`/reports?type=${type}`);
  };
  
  // Helper function to determine status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'forwarded': return 'bg-info';
      case 'in-progress': return 'bg-primary';
      case 'ready-for-pickup': return 'bg-info';
      case 'delivered': return 'bg-success';
      case 'partially-fulfilled': return 'bg-warning';
      case 'cancelled': return 'bg-secondary';
      case 'info-requested': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };
  
  // Helper function to determine status progress class
  const getStatusProgressClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'forwarded': return 'bg-info';
      case 'in-progress': return 'bg-primary';
      case 'ready-for-pickup': return 'bg-info';
      case 'delivered': return 'bg-success';
      case 'partially-fulfilled': return 'bg-warning';
      case 'cancelled': return 'bg-secondary';
      case 'info-requested': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };
  
  // Helper function to determine priority badge class
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'emergency': return 'bg-danger';
      case 'urgent': return 'bg-warning';
      case 'normal': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };
  
  // Render table based on report type
  const renderReportTable = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="alert alert-info">
          <h5><i className="fas fa-info-circle me-2"></i>No data available for this report</h5>
          <p>There are no records matching your current filter criteria. Try one of the following:</p>
          <ul>
            <li>Change the time range filter (e.g., select "All Time" instead of a specific period)</li>
            <li>{reportType === 'bloodRequests' && "Clear the status or priority filters by selecting \"All\""}</li>
            <li>Check if there is historical data for the selected time period</li>
            <li>Verify that the backend server is running and accessible</li>
            {currentUser && currentUser.role === 'Super Admin' && (
              <li>Try selecting a different branch or "All Branches"</li>
            )}
            {currentUser && currentUser.role === 'Admin' && (
              <li>Check if your branch has any {reportType === 'bloodRequests' ? 'blood requests' : 
                                              reportType === 'inventory' ? 'inventory records' : 
                                              reportType === 'donors' ? 'donor records' : 'data'} for the selected period</li>
            )}
          </ul>
          <div className="mt-3">
            <button 
              className="btn btn-outline-primary" 
              onClick={generateReport}
            >
              <i className="fas fa-sync-alt me-1"></i> Refresh Data
            </button>
          </div>
        </div>
      );
    }
    
    switch (reportType) {
      case 'inventory':
        return (
          <ReportTable>
            <thead>
              <tr>
                <th>Blood Type</th>
                <th>Units Available</th>
                <th>Last Updated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index}>
                  <td>{item.bloodType}</td>
                  <td>{item.quantity}</td>
                  <td>{new Date(item.updatedAt || new Date()).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${item.quantity > 20 ? 'bg-success' : item.quantity > 5 ? 'bg-warning' : 'bg-danger'}`}>
                      {item.quantity > 20 ? 'Adequate' : item.quantity > 5 ? 'Low' : 'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        );
        
      case 'donors':
        return (
          <ReportTable>
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Blood Type</th>
                <th>Donation Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((donation, index) => (
                <tr key={index}>
                  <td>{donation.donorName}</td>
                  <td>{donation.bloodType}</td>
                  <td>{new Date(donation.donationDate).toLocaleDateString()}</td>
                  <td>{donation.amount} mL</td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        );
        
      case 'bloodType':
        return (
          <ReportTable>
            <thead>
              <tr>
                <th>Blood Type</th>
                <th>Units</th>
                <th>Percentage</th>
                <th>Visual</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index}>
                  <td>{item.type}</td>
                  <td>{item.quantity}</td>
                  <td>{item.percentage}%</td>
                  <td>
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${item.percentage}%` }}
                        aria-valuenow={item.percentage} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        {item.percentage}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        );
        
      case 'staff':
        return (
          <>
            <div className="alert alert-info mb-4">
              <i className="fas fa-info-circle me-2"></i>
              This report shows staff performance for the selected time period: <strong>{timeRange}</strong>.
              {branchId && <span> Branch: <strong>{getBranchName(branchId)}</strong>.</span>}
            </div>
            
            <ReportTable>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Donors Registered</th>
                  <th>Donations Processed</th>
                  <th>Inventory Updates</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((staff, index) => {
                  // Calculate activity score (simple average for visualization)
                  const activityScore = Math.floor((staff.donorsRegistered + staff.donationsProcessed + staff.inventoryUpdates) / 3);
                  const percentage = Math.min(100, Math.max(10, activityScore * 3)); // Scale for better visualization
                  
                  return (
                    <tr key={index}>
                      <td>{staff.name}</td>
                      <td>{staff.donorsRegistered}</td>
                      <td>{staff.donationsProcessed}</td>
                      <td>{staff.inventoryUpdates}</td>
                      <td>
                        <div className="progress">
                          <div 
                            className={`progress-bar ${percentage > 66 ? 'bg-success' : percentage > 33 ? 'bg-warning' : 'bg-danger'}`}
                            role="progressbar" 
                            style={{ width: `${percentage}%` }}
                            aria-valuenow={percentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                            {activityScore}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ReportTable>
          </>
        );
        
      case 'branch':
        return (
          <ReportTable>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Change From Previous Period</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((metric, index) => (
                <tr key={index}>
                  <td>{metric.name}</td>
                  <td>{metric.value}</td>
                  <td>
                    <span className={metric.change > 0 ? 'text-success' : metric.change < 0 ? 'text-danger' : ''}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        );
        
      case 'bloodRequests':
        // Calculate summary statistics
        const totalRequests = reportData.length;
        
        // Status counts
        const statusCounts = reportData.reduce((acc, request) => {
          acc[request.status] = (acc[request.status] || 0) + 1;
          return acc;
        }, {});
        
        // Priority counts
        const priorityCounts = reportData.reduce((acc, request) => {
          acc[request.priority] = (acc[request.priority] || 0) + 1;
          return acc;
        }, {});
        
        // Blood type counts
        const bloodTypeCounts = reportData.reduce((acc, request) => {
          acc[request.bloodType] = (acc[request.bloodType] || 0) + 1;
          return acc;
        }, {});
        
        // Fulfillment rate - how many requests were completed
        const fulfillmentRate = (
          ((statusCounts['delivered'] || 0) / totalRequests) * 100
        ).toFixed(1);
        
        // Rejection rate
        const rejectionRate = (
          ((statusCounts['rejected'] || 0) / totalRequests) * 100
        ).toFixed(1);
        
        return (
          <>
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Blood Request Report Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="card bg-light mb-3">
                          <div className="card-body text-center">
                            <h5 className="card-title">Total Requests</h5>
                            <h2 className="mb-0">{totalRequests}</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-success text-white mb-3">
                          <div className="card-body text-center">
                            <h5 className="card-title">Fulfillment Rate</h5>
                            <h2 className="mb-0">{fulfillmentRate}%</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-warning text-dark mb-3">
                          <div className="card-body text-center">
                            <h5 className="card-title">Emergency Requests</h5>
                            <h2 className="mb-0">{priorityCounts['emergency'] || 0}</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-danger text-white mb-3">
                          <div className="card-body text-center">
                            <h5 className="card-title">Rejection Rate</h5>
                            <h2 className="mb-0">{rejectionRate}%</h2>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Status Distribution</h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered table-sm">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Percentage</th>
                          <th>Visualization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(statusCounts).map(([status, count]) => (
                          <tr key={status}>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(status)}`}>
                                {status}
                              </span>
                            </td>
                            <td>{count}</td>
                            <td>{((count / totalRequests) * 100).toFixed(1)}%</td>
                            <td>
                              <div className="progress">
                                <div 
                                  className={`progress-bar ${getStatusProgressClass(status)}`}
                                  role="progressbar" 
                                  style={{ width: `${(count / totalRequests) * 100}%` }}
                                  aria-valuenow={(count / totalRequests) * 100} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100">
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Blood Type Distribution</h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered table-sm">
                      <thead>
                        <tr>
                          <th>Blood Type</th>
                          <th>Count</th>
                          <th>Percentage</th>
                          <th>Visualization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(bloodTypeCounts).map(([bloodType, count]) => (
                          <tr key={bloodType}>
                            <td>
                              <span className="badge bg-danger">
                                {bloodType}
                              </span>
                            </td>
                            <td>{count}</td>
                            <td>{((count / totalRequests) * 100).toFixed(1)}%</td>
                            <td>
                              <div className="progress">
                                <div 
                                  className="progress-bar bg-danger"
                                  role="progressbar" 
                                  style={{ width: `${(count / totalRequests) * 100}%` }}
                                  aria-valuenow={(count / totalRequests) * 100} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100">
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <h5 className="mb-3">Blood Request Details</h5>
            <ReportTable>
              <thead>
                <tr>
                  <th>Blood Type</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Hospital</th>
                  <th>Requested Date</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((request, index) => (
                  <tr key={index}>
                    <td>{request.bloodType}</td>
                    <td>
                      {request.fulfilledQuantity > 0 
                        ? `${request.fulfilledQuantity}/${request.quantity}` 
                        : request.quantity}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td>{request.hospitalName}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(request.updatedAt || request.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </ReportTable>
          </>
        );
        
      default:
        return (
          <div className="alert alert-warning">
            Unknown report type: {reportType}
          </div>
        );
    }
  };
  
  return (
    <ReportContainer>
      <ReportHeader>
        <h2>{getReportTitleForDisplay()}</h2>
        <ButtonGroup>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => history.goBack()}
          >
            Back
          </button>
          
          <button
            className="btn btn-outline-primary"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Refreshing...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt me-1"></i>
                Refresh Data
              </>
            )}
          </button>
          
          <button 
            className="btn btn-outline-primary" 
            onClick={exportToCsv}
            disabled={!reportData || reportData.length === 0}
          >
            <i className="fas fa-file-download me-1"></i>
            Export to CSV
          </button>
        </ButtonGroup>
      </ReportHeader>
      
      <FilterSection className="row">
        <div className="col-md-4 mb-2">
          <label htmlFor="timeRange" className="form-label">Time Range</label>
          <select 
            id="timeRange" 
            className="form-control"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        {currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') && (
          <div className="col-md-4 mb-2">
            <label htmlFor="branchSelect" className="form-label">Branch</label>
            <select 
              id="branchSelect" 
              className="form-control"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={currentUser.role === 'Admin'} 
            >
              {currentUser.role === 'Super Admin' && (
                <option value="">All Branches</option>
              )}
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name || branch._id}
                </option>
              ))}
            </select>
            {currentUser.role === 'Admin' && (
              <small className="form-text text-muted">
                As a Branch Admin, you only see data for your assigned branch.
              </small>
            )}
          </div>
        )}
        
        <div className="col-md-4 mb-2">
          <label htmlFor="reportType" className="form-label">Report Type</label>
          <select 
            id="reportType" 
            className="form-control"
            value={reportType}
            onChange={(e) => changeReportType(e.target.value)}
          >
            <option value="inventory">Inventory</option>
            <option value="donors">Donor Activity</option>
            <option value="bloodType">Blood Type Distribution</option>
            {(currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin')) && (
              <>
                <option value="bloodRequests">Blood Requests</option>
                <option value="staff">Staff Performance</option>
              </>
            )}
            {currentUser && currentUser.role === 'Super Admin' && (
              <option value="branch">Branch Summary</option>
            )}
          </select>
        </div>
        
        {reportType === 'bloodRequests' && (
          <>
            <div className="col-md-4 mb-2">
              <label htmlFor="statusFilter" className="form-label">Status</label>
              <select 
                id="statusFilter" 
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="forwarded">Forwarded</option>
                <option value="in-progress">In Progress</option>
                <option value="partially-fulfilled">Partially Fulfilled</option>
                <option value="ready-for-pickup">Ready for Pickup</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="info-requested">Info Requested</option>
              </select>
            </div>
            
            <div className="col-md-4 mb-2">
              <label htmlFor="priorityFilter" className="form-label">Priority</label>
              <select 
                id="priorityFilter" 
                className="form-control"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </>
        )}
      </FilterSection>
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading report data...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div>
          {renderReportTable()}
          
          <div className="text-muted mt-3">
            <small>
              <i className="fas fa-info-circle mr-1"></i> 
              This report was generated on {new Date().toLocaleString()} 
              {branchId ? ` for branch ID: ${branchId}` : ' for all branches'}.
            </small>
          </div>
        </div>
      )}
    </ReportContainer>
  );
};

export default withRouter(ReportGenerator); 