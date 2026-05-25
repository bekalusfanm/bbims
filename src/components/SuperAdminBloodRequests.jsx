import React, { useState, useEffect } from "react";
import { getBloodRequests, saveBloodRequest } from "../services/bloodRequestService";
import { getAllBranches } from "../services/branchService";
import { toast } from "react-toastify";
import { useUser } from "../context/userContext";
import styled from "styled-components";

const PageContainer = styled.div`
  padding: 20px;
`;

const CardContainer = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const ActionButton = styled.button`
  margin-right: 5px;
`;

const SuperAdminBloodRequests = () => {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filterStatus, setFilterStatus] = useState("forwarded");

  useEffect(() => {
    if (user && user.role === "Super Admin") {
      fetchData();
      // Set up polling for regular updates
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    } else {
      toast.error("You don't have permission to access this page");
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch blood requests and branches in parallel
      const [requestsResponse, branchesData] = await Promise.all([
        getBloodRequests(),
        getAllBranches()
      ]);
      
      console.log("Blood requests data:", requestsResponse.data);
      console.log("Branches data:", branchesData);
      
      setBloodRequests(requestsResponse.data);
      setBranches(branchesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load blood requests data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      const updatedRequest = { ...request, status: "approved" };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request approved successfully");
      fetchData();
    } catch (error) {
      console.error("Error approving blood request:", error);
      toast.error("Failed to approve blood request");
    }
  };

  const handleReject = async (request) => {
    try {
      const updatedRequest = { ...request, status: "rejected" };
      await saveBloodRequest(updatedRequest);
      toast.success("Blood request rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting blood request:", error);
      toast.error("Failed to reject blood request");
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId || !branches || branches.length === 0) return "Unknown";
    const branch = branches.find(b => b._id === branchId);
    return branch ? branch.name : "Unknown Branch";
  };

  const filteredRequests = bloodRequests.filter(request => {
    if (filterStatus === "all") return true;
    return request.status === filterStatus;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading blood requests...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Blood Requests Management</h2>
        <div className="btn-group">
          <button 
            className={`btn ${filterStatus === "forwarded" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilterStatus("forwarded")}
          >
            Forwarded
          </button>
          <button 
            className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilterStatus("all")}
          >
            All Requests
          </button>
        </div>
      </div>

      <CardContainer>
        {filteredRequests.length === 0 ? (
          <div className="alert alert-info">
            No {filterStatus === "all" ? "" : filterStatus} blood requests found.
          </div>
        ) : (
          <TableContainer>
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Hospital</th>
                  <th>Blood Type</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Branch</th>
                  <th>Requested On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr key={index}>
                    <td>{request.hospitalName}</td>
                    <td>
                      <span className="badge bg-danger">{request.bloodType}</span>
                    </td>
                    <td>{request.quantity} units</td>
                    <td>
                      <span className={`badge ${
                        request.status === "forwarded" ? "bg-info" :
                        request.status === "approved" ? "bg-success" :
                        request.status === "rejected" ? "bg-danger" :
                        "bg-secondary"
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{getBranchName(request.branchId)}</td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td>
                      {request.status === "forwarded" && (
                        <div className="btn-group">
                          <ActionButton 
                            className="btn btn-sm btn-success" 
                            onClick={() => handleApprove(request)}
                          >
                            Approve
                          </ActionButton>
                          <ActionButton 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleReject(request)}
                          >
                            Reject
                          </ActionButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableContainer>
        )}
      </CardContainer>
    </PageContainer>
  );
};

export default SuperAdminBloodRequests; 
 