import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getAuditLogs } from "../services/auditService";
import { useUser } from "../context/userContext";
import Pagination from "./common/pagination";
import { paginate } from "../utils/paginate";

const AuditLogs = () => {
  const user = useUser();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    user: "",
    dateFrom: "",
    dateTo: "",
    entity: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortColumn, setSortColumn] = useState({
    path: "timestamp",
    order: "desc"
  });

  useEffect(() => {
    if (!user || user.role !== "Super Admin") {
      toast.error("You don't have permission to access this page");
      return;
    }
    
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setCurrentPage(1);
  };

  const handleSort = (path) => {
    const newSortColumn = { ...sortColumn };
    if (newSortColumn.path === path) {
      newSortColumn.order = newSortColumn.order === "asc" ? "desc" : "asc";
    } else {
      newSortColumn.path = path;
      newSortColumn.order = "asc";
    }
    setSortColumn(newSortColumn);
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      user: "",
      dateFrom: "",
      dateTo: "",
      entity: ""
    });
    setCurrentPage(1);
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      // Apply all active filters
      if (filters.action && log.action.toLowerCase() !== filters.action.toLowerCase()) {
        return false;
      }
      
      if (filters.user && !log.username.toLowerCase().includes(filters.user.toLowerCase())) {
        return false;
      }
      
      if (filters.entity && !log.entityType.toLowerCase().includes(filters.entity.toLowerCase())) {
        return false;
      }
      
      // Date range filtering
      if (filters.dateFrom || filters.dateTo) {
        const logDate = new Date(log.timestamp);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (logDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59); // End of the day
          if (logDate > toDate) return false;
        }
      }
      
      return true;
    });
  };

  const getSortedLogs = (logs) => {
    const { path, order } = sortColumn;
    return [...logs].sort((a, b) => {
      const valueA = path === "timestamp" ? new Date(a[path]) : a[path];
      const valueB = path === "timestamp" ? new Date(b[path]) : b[path];
      
      if (valueA < valueB) return order === "asc" ? -1 : 1;
      if (valueA > valueB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const actionBadgeColor = (action) => {
    switch (action.toLowerCase()) {
      case "create": return "bg-success";
      case "update": return "bg-info";
      case "delete": return "bg-danger";
      case "login": return "bg-primary";
      default: return "bg-secondary";
    }
  };

  const exportToCSV = () => {
    const filteredLogs = getFilteredLogs();
    const sortedLogs = getSortedLogs(filteredLogs);
    
    // Format the logs for export
    const formattedLogs = sortedLogs.map(log => ({
      timestamp: formatTimestamp(log.timestamp),
      username: log.username,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress
    }));
    
    // Convert to CSV
    const headers = Object.keys(formattedLogs[0]).join(',');
    const csvRows = formattedLogs.map(row => 
      Object.values(row).map(value => 
        `"${value}"`
      ).join(',')
    );
    
    const csvContent = [headers, ...csvRows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center mt-5"><p>Loading audit logs...</p></div>;
  }

  // Filter and sort logs
  const filteredLogs = getFilteredLogs();
  const sortedLogs = getSortedLogs(filteredLogs);
  const paginatedLogs = paginate(sortedLogs, currentPage, pageSize);

  // Get unique values for dropdowns
  const actions = [...new Set(logs.map(log => log.action))];
  const entities = [...new Set(logs.map(log => log.entityType))];
  const users = [...new Set(logs.map(log => log.username))];

  return (
    <div className="container mt-4">
      <h1 className="mb-4">System Audit Logs</h1>
      
      <div className="card mb-4">
        <div className="card-header">Filter Logs</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-2">
              <div className="mb-3">
                <label className="form-label">Action</label>
                <select 
                  className="form-select"
                  name="action" 
                  value={filters.action} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Actions</option>
                  {actions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md-2">
              <div className="mb-3">
                <label className="form-label">Entity Type</label>
                <select 
                  className="form-select"
                  name="entity" 
                  value={filters.entity} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Entities</option>
                  {entities.map(entity => (
                    <option key={entity} value={entity}>{entity}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md-2">
              <div className="mb-3">
                <label className="form-label">User</label>
                <select 
                  className="form-select"
                  name="user" 
                  value={filters.user} 
                  onChange={handleFilterChange}
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="col-md-2">
              <div className="mb-3">
                <label className="form-label">From Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="col-md-2">
              <div className="mb-3">
                <label className="form-label">To Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="col-md-2 d-flex align-items-end mb-3">
              <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p>Showing {filteredLogs.length} audit log entries</p>
        <button 
          type="button"
          className="btn btn-outline-success btn-sm" 
          onClick={exportToCSV}
          disabled={filteredLogs.length === 0}
        >
          Export to CSV
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-bordered table-hover">
              <thead>
                <tr>
                  <th onClick={() => handleSort("timestamp")} style={{cursor: "pointer"}}>
                    Timestamp {sortColumn.path === "timestamp" && (sortColumn.order === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("username")} style={{cursor: "pointer"}}>
                    User {sortColumn.path === "username" && (sortColumn.order === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("action")} style={{cursor: "pointer"}}>
                    Action {sortColumn.path === "action" && (sortColumn.order === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("entityType")} style={{cursor: "pointer"}}>
                    Entity Type {sortColumn.path === "entityType" && (sortColumn.order === "asc" ? "▲" : "▼")}
                  </th>
                  <th>Entity ID</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log, index) => (
                  <tr key={index}>
                    <td>{formatTimestamp(log.timestamp)}</td>
                    <td>{log.username}</td>
                    <td>
                      <span className={`badge ${actionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entityType}</td>
                    <td>{log.entityId}</td>
                    <td>{log.details}</td>
                    <td>{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Pagination
              itemsCount={filteredLogs.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs; 