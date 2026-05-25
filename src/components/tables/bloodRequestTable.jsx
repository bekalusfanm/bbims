import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../../context/userContext";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { getUserById } from "../../services/userService";
import { getBranchById, getAllBranches } from "../../services/branchService";

const TableContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 20px; /* Space between the table and the pagination */
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
`;

const StyledThead = styled.thead`
  background-color: #343a40;
  color: #fff;

  th {
    padding: 12px 15px;
    cursor: pointer;
    position: relative;

    &:hover {
      background-color: #495057;
    }

    &.sorted-asc::after {
      content: "▲";
      position: absolute;
      right: 10px;
    }

    &.sorted-desc::after {
      content: "▼";
      position: absolute;
      right: 10px;
    }

    &:first-child {
      border-top-left-radius: 8px;
    }

    &:last-child {
      border-top-right-radius: 8px;
    }
  }
`;

const StyledTbody = styled.tbody`
  tr {
    &:nth-of-type(even) {
      background-color: #f2f2f2;
    }

    &:hover {
      background-color: #e9ecef;
      cursor: pointer;
    }

    td {
      padding: 12px 15px;
      text-align: left;

      &:first-child {
        border-bottom-left-radius: 8px;
      }

      &:last-child {
        border-bottom-right-radius: 8px;
      }
    }
  }
`;

const ActionButton = styled.button`
  border: none;
  padding: 8px 12px;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;

  &.btn-danger {
    background-color: #dc3545;
    &:hover {
      background-color: #c82333;
    }
  }

  &.btn-success {
    background-color: #28a745;
    &:hover {
      background-color: #218838;
    }
  }

  &.btn-warning {
    background-color: #ffc107;
    &:hover {
      background-color: #e0a800;
    }
  }

  &.btn-info {
    background-color: #17a2b8;
    &:hover {
      background-color: #138496;
    }
  }

  &.btn-secondary {
    background-color: #6c757d;
    &:hover {
      background-color: #5a6268;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  
  &.pending {
    background-color: #ffc107;
    color: #212529;
  }
  
  &.approved {
    background-color: #28a745;
    color: #fff;
  }
  
  &.rejected {
    background-color: #dc3545;
    color: #fff;
  }
  
  &.forwarded {
    background-color: #17a2b8;
    color: #fff;
  }
  
  &.in-progress {
    background-color: #6f42c1;
    color: #fff;
  }
  
  &.ready-for-pickup {
    background-color: #20c997;
    color: #212529;
  }
  
  &.delivered {
    background-color: #28a745;
    color: #fff;
  }
  
  &.partially-fulfilled {
    background-color: #fd7e14;
    color: #fff;
  }
  
  &.cancelled {
    background-color: #6c757d;
    color: #fff;
  }
  
  &.info-requested {
    background-color: #007bff;
    color: #fff;
  }
`;

const PriorityBadge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  
  &.normal {
    background-color: #6c757d;
    color: #fff;
  }
  
  &.urgent {
    background-color: #fd7e14;
    color: #fff;
  }
  
  &.emergency {
    background-color: #dc3545;
    color: #fff;
  }
`;

const LoadingIndicator = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const BloodRequestTable = ({ 
  bloodRequests, 
  onDelete, 
  onSort, 
  sortColumn, 
  onAccept, 
  onReject, 
  onForward,
  onUpdateStatus,
  onPartialFulfill,
  onCancel,
  onRequestInfo,
  onProvideInfo
}) => {
  const user = useUser();
  const isAdmin = user && user.role === "Admin";
  const isSuperAdmin = user && user.role === "Super Admin";
  const isHospitalAdmin = user && user.role === "Hospital Admin";

  // State for modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [showProvideInfoModal, setShowProvideInfoModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [forwardReason, setForwardReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [infoRequest, setInfoRequest] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [availableUnits, setAvailableUnits] = useState(0);
  const [partialFulfillmentNotes, setPartialFulfillmentNotes] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // State for resolved names
  const [requesterNames, setRequesterNames] = useState({});
  const [branchNames, setBranchNames] = useState({});
  const [loadingNames, setLoadingNames] = useState(false);

  // Fetch branches when the component mounts
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await getAllBranches();
        setBranches(branchesData);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    
    fetchBranches();
  }, []);

  // Fetch user and branch details when blood requests change
  useEffect(() => {
    const fetchDetails = async () => {
      if (!bloodRequests || bloodRequests.length === 0) return;
      
      setLoadingNames(true);
      
      // Get unique requester IDs and branch IDs
      const requesterIds = [...new Set(bloodRequests.map(req => req.requester))];
      const branchIds = [...new Set(bloodRequests.map(req => req.branchId))];
      
      // Create objects to store names
      const requesterNameMap = { ...requesterNames };
      const branchNameMap = { ...branchNames };
      
      // Fetch user details
      for (const requesterId of requesterIds) {
        if (!requesterNameMap[requesterId]) {
          try {
            const userData = await getUserById(requesterId);
            requesterNameMap[requesterId] = userData ? 
              `${userData.personalInfo?.firstName || ''} ${userData.personalInfo?.lastName || ''}`.trim() || userData.name || 'Unknown User' : 
              'Unknown User';
          } catch (error) {
            console.error(`Error fetching user ${requesterId}:`, error);
            requesterNameMap[requesterId] = 'Unknown User';
          }
        }
      }
      
      // Fetch branch details
      for (const branchId of branchIds) {
        if (!branchNameMap[branchId]) {
          try {
            const branchData = await getBranchById(branchId);
            branchNameMap[branchId] = branchData ? branchData.name || 'Unknown Branch' : 'Unknown Branch';
          } catch (error) {
            console.error(`Error fetching branch ${branchId}:`, error);
            branchNameMap[branchId] = 'Unknown Branch';
          }
        }
      }
      
      setRequesterNames(requesterNameMap);
      setBranchNames(branchNameMap);
      setLoadingNames(false);
    };
    
    fetchDetails();
  }, [bloodRequests]);

  const getRequesterName = (requesterId) => {
    return requesterNames[requesterId] || requesterId || 'Unknown';
  };
  
  const getBranchName = (branchId) => {
    return branchNames[branchId] || branchId || 'Unknown';
  };

  // Check if a request was reassigned to this branch
  const wasReassigned = (bloodRequest) => {
    if (!bloodRequest || !bloodRequest.statusHistory || !Array.isArray(bloodRequest.statusHistory)) {
      return false;
    }
    
    return bloodRequest.statusHistory.some(history => history.status === "reassigned");
  };

  const raiseSort = (path) => {
    const newSortColumn = { ...sortColumn };
    if (newSortColumn.path === path) {
      newSortColumn.order = newSortColumn.order === "asc" ? "desc" : "asc";
    } else {
      newSortColumn.path = path;
      newSortColumn.order = "asc";
    }
    onSort(newSortColumn);
  };

  const renderSortIcon = (column) => {
    if (column !== sortColumn.path) return null;
    if (sortColumn.order === "asc") return "sorted-asc";
    return "sorted-desc";
  };

  const handleRejectClick = (bloodRequest) => {
    setSelectedRequest(bloodRequest);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handlePartialFulfillClick = (bloodRequest) => {
    setSelectedRequest(bloodRequest);
    setAvailableUnits(0);
    setPartialFulfillmentNotes("");
    setShowPartialModal(true);
  };

  const handleForwardClick = (bloodRequest) => {
    setSelectedRequest(bloodRequest);
    setForwardReason("");
    setShowForwardModal(true);
  };

  const handleApproveClick = (bloodRequest) => {
    if (isSuperAdmin && bloodRequest.status === "forwarded") {
      // Super Admin is approving a forwarded request - show reassign modal
      setSelectedRequest(bloodRequest);
      setSelectedBranchId("");
      setShowReassignModal(true);
    } else {
      // Regular approval
      onAccept(bloodRequest);
    }
  };

  const handleForwardConfirm = () => {
    if (forwardReason.trim() === "") {
      alert("Please provide a reason for forwarding this request");
      return;
    }
    onForward(selectedRequest, forwardReason);
    setShowForwardModal(false);
  };

  const handleReassignConfirm = () => {
    if (!selectedBranchId) {
      alert("Please select a branch to reassign this request");
      return;
    }
    // Pass the selected branch ID along with the request
    onAccept(selectedRequest, selectedBranchId);
    setShowReassignModal(false);
  };

  const handleRejectConfirm = () => {
    if (rejectionReason.trim() === "") {
      alert("Please provide a reason for rejection");
      return;
    }
    onReject(selectedRequest, rejectionReason);
    setShowRejectModal(false);
  };

  const handlePartialFulfillConfirm = () => {
    if (availableUnits <= 0) {
      alert("Available units must be greater than 0");
      return;
    }
    if (availableUnits >= selectedRequest.quantity) {
      alert("For partial fulfillment, available units must be less than requested quantity");
      return;
    }
    onPartialFulfill(selectedRequest, availableUnits, partialFulfillmentNotes);
    setShowPartialModal(false);
  };

  const handleCancelClick = (bloodRequest) => {
    setSelectedRequest(bloodRequest);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleRequestInfoClick = (bloodRequest) => {
    setSelectedRequest(bloodRequest);
    setInfoRequest("");
    setShowRequestInfoModal(true);
  };

  const handleProvideInfoClick = (bloodRequest) => {
    setSelectedRequest(bloodRequest);
    setAdditionalInfo("");
    setShowProvideInfoModal(true);
  };

  const handleCancelConfirm = () => {
    if (cancelReason.trim() === "") {
      alert("Please provide a reason for cancellation");
      return;
    }
    onCancel(selectedRequest, cancelReason);
    setShowCancelModal(false);
  };

  const handleRequestInfoConfirm = () => {
    if (infoRequest.trim() === "") {
      alert("Please specify what information you need");
      return;
    }
    onRequestInfo(selectedRequest, infoRequest);
    setShowRequestInfoModal(false);
  };

  const handleProvideInfoConfirm = () => {
    if (additionalInfo.trim() === "") {
      alert("Please provide the requested information");
      return;
    }
    onProvideInfo(selectedRequest, additionalInfo);
    setShowProvideInfoModal(false);
  };

  const renderActions = (bloodRequest) => {
    // Hospital admin actions
    if (isHospitalAdmin) {
      if (bloodRequest.status === "pending") {
        return (
          <div>
            <ActionButton
              onClick={() => onDelete(bloodRequest)}
              className="btn-danger"
            >
              Delete
            </ActionButton>
            <ActionButton
              onClick={() => handleCancelClick(bloodRequest)}
              className="btn-secondary"
            >
              Cancel
            </ActionButton>
          </div>
        );
      } else if (bloodRequest.status === "info-requested") {
        return (
          <ActionButton
            onClick={() => handleProvideInfoClick(bloodRequest)}
            className="btn-info"
          >
            Provide Info
          </ActionButton>
        );
      } else if (["approved", "in-progress", "ready-for-pickup", "forwarded", "partially-fulfilled"].includes(bloodRequest.status)) {
        return (
          <ActionButton
            onClick={() => handleCancelClick(bloodRequest)}
            className="btn-secondary"
          >
            Cancel
          </ActionButton>
        );
      }
      return null;
    }

    // Branch admin handling requests
    if (isAdmin) {
      if (bloodRequest.status === "pending") {
        return (
          <div>
            <ActionButton
              onClick={() => onAccept(bloodRequest)}
              className="btn-success"
            >
              Accept
            </ActionButton>
            <ActionButton
              onClick={() => handleRejectClick(bloodRequest)}
              className="btn-danger"
            >
              Reject
            </ActionButton>
            <ActionButton
              onClick={() => handleForwardClick(bloodRequest)}
              className="btn-info"
              title="Forward this request to Super Admin when your branch cannot fulfill it"
            >
              Forward
            </ActionButton>
            <ActionButton
              onClick={() => handlePartialFulfillClick(bloodRequest)}
              className="btn-warning"
              title="Partially fulfill this request"
            >
              Partial
            </ActionButton>
            <ActionButton
              onClick={() => handleRequestInfoClick(bloodRequest)}
              className="btn-primary"
              title="Request additional information from the hospital"
            >
              Request Info
            </ActionButton>
          </div>
        );
      } else if (bloodRequest.status === "approved") {
        return (
          <div>
            <ActionButton
              onClick={() => onUpdateStatus(bloodRequest, "in-progress")}
              className="btn-info"
            >
              In Progress
            </ActionButton>
            <ActionButton
              onClick={() => onUpdateStatus(bloodRequest, "ready-for-pickup")}
              className="btn-success"
            >
              Ready
            </ActionButton>
          </div>
        );
      } else if (bloodRequest.status === "in-progress") {
        return (
          <ActionButton
            onClick={() => onUpdateStatus(bloodRequest, "ready-for-pickup")}
            className="btn-success"
          >
            Ready
          </ActionButton>
        );
      } else if (bloodRequest.status === "ready-for-pickup") {
        return (
          <ActionButton
            onClick={() => onUpdateStatus(bloodRequest, "delivered")}
            className="btn-success"
          >
            Delivered
          </ActionButton>
        );
      }
    }

    // Super Admin can approve, reject or delete forwarded requests
    if (isSuperAdmin) {
      if (bloodRequest.status === "forwarded") {
        return (
          <div>
            <ActionButton
              onClick={() => handleApproveClick(bloodRequest)}
              className="btn-success"
              title="Approve and reassign to a branch that can fulfill the request"
            >
              Approve
            </ActionButton>
            <ActionButton
              onClick={() => handleRejectClick(bloodRequest)}
              className="btn-danger"
            >
              Reject
            </ActionButton>
          </div>
        );
      }
      return (
        <ActionButton
          onClick={() => onDelete(bloodRequest)}
          className="btn-danger"
        >
          Delete
        </ActionButton>
      );
    }

    // Default action for other cases (e.g. staff)
    return (
      <ActionButton
        onClick={() => onDelete(bloodRequest)}
        className="btn-danger"
      >
        Delete
      </ActionButton>
    );
  };

  const renderStatus = (status) => {
    return (
      <StatusBadge className={status}>
        {status}
      </StatusBadge>
    );
  };

  const renderPriority = (priority) => {
    if (!priority) return <PriorityBadge className="normal">Normal</PriorityBadge>;
    if (priority === "urgent") return <PriorityBadge className="urgent">Urgent</PriorityBadge>;
    if (priority === "emergency") return <PriorityBadge className="emergency">Emergency</PriorityBadge>;
    return <PriorityBadge className="normal">Normal</PriorityBadge>;
  };

  const renderTable = () => {
    console.log("Rendering blood request table with:", bloodRequests.length, "requests");
    
    if (!Array.isArray(bloodRequests) || bloodRequests.length === 0) {
      return (
        <div className="text-center p-5">
          <h4>No blood requests found</h4>
          <p className="text-muted">
            {isAdmin ? "There are no blood requests assigned to your branch at this time." :
             isSuperAdmin ? "There are no forwarded blood requests at this time." :
             "You have not made any blood requests yet."}
          </p>
        </div>
      );
    }

    return (
      <TableContainer>
        <StyledTable>
          <StyledThead>
            <tr>
              <th
                onClick={() => raiseSort("requester")}
                className={renderSortIcon("requester")}
              >
                Requester
              </th>
              <th
                onClick={() => raiseSort("branchId")}
                className={renderSortIcon("branchId")}
              >
                Branch
              </th>
              <th
                onClick={() => raiseSort("bloodType")}
                className={renderSortIcon("bloodType")}
              >
                Blood Type
              </th>
              <th
                onClick={() => raiseSort("quantity")}
                className={renderSortIcon("quantity")}
              >
                Quantity
              </th>
              <th
                onClick={() => raiseSort("hospitalName")}
                className={renderSortIcon("hospitalName")}
              >
                Hospital Name
              </th>
              <th
                onClick={() => raiseSort("priority")}
                className={renderSortIcon("priority")}
              >
                Priority
              </th>
              <th
                onClick={() => raiseSort("status")}
                className={renderSortIcon("status")}
              >
                Status
              </th>
              <th>Actions</th>
            </tr>
          </StyledThead>
          <StyledTbody>
            {bloodRequests.map((bloodRequest) => (
              <tr key={bloodRequest._id}>
                <Link
                  to={`/blood-request/${bloodRequest._id}`}
                  style={{
                    display: "contents",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <td>
                    {loadingNames ? (
                      <LoadingIndicator>Loading...</LoadingIndicator>
                    ) : (
                      getRequesterName(bloodRequest.requester)
                    )}
                  </td>
                  <td>
                    {loadingNames ? (
                      <LoadingIndicator>Loading...</LoadingIndicator>
                    ) : (
                      getBranchName(bloodRequest.branchId)
                    )}
                  </td>
                  <td>
                    <span className="badge bg-danger">{bloodRequest.bloodType}</span>
                  </td>
                  <td>
                    {bloodRequest.fulfilledQuantity > 0 ? 
                      `${bloodRequest.fulfilledQuantity}/${bloodRequest.quantity}` : 
                      bloodRequest.quantity}
                  </td>
                  <td>
                    <div style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {bloodRequest.hospitalName}
                    </div>
                  </td>
                  <td>
                    {renderPriority(bloodRequest.priority)}
                  </td>
                  <td>
                    <div>
                      {renderStatus(bloodRequest.status)}
                      {wasReassigned(bloodRequest) && (
                        <span className="badge bg-info ms-1" style={{fontSize: "0.7rem"}}>
                          Reassigned
                        </span>
                      )}
                    </div>
                  </td>
                </Link>
                <td>
                  {renderActions(bloodRequest)}
                </td>
              </tr>
            ))}
          </StyledTbody>
        </StyledTable>
      </TableContainer>
    );
  };

  return (
    <>
      {renderTable()}

      {/* Rejection Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Blood Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Reason for rejection</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for the rejection"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectConfirm}>
            Reject Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Forward Modal */}
      <Modal show={showForwardModal} onHide={() => setShowForwardModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Forward Blood Request to Super Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Reason for forwarding</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={forwardReason}
                onChange={(e) => setForwardReason(e.target.value)}
                placeholder="Please explain why your branch cannot fulfill this request (e.g., insufficient stock, special requirements, etc.)"
              />
              <Form.Text className="text-muted">
                This request will be sent to Super Admin who can reassign it to another branch.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForwardModal(false)}>
            Cancel
          </Button>
          <Button variant="info" onClick={handleForwardConfirm}>
            Forward Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reassign Modal for Super Admin */}
      <Modal show={showReassignModal} onHide={() => setShowReassignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reassign Blood Request to Branch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Select Branch to Handle This Request</Form.Label>
              <Form.Control 
                as="select"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">Select a branch...</option>
                {branches.map(branch => (
                  // Don't include the original branch that forwarded the request
                  selectedRequest && branch._id !== selectedRequest.branchId && 
                  <option key={branch._id} value={branch._id}>
                    {branch.name} - {branch.location}
                  </option>
                ))}
              </Form.Control>
              <Form.Text className="text-muted">
                Choose a branch that has sufficient stock to fulfill this request. The original branch forwarded this request because they couldn't handle it.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReassignModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleReassignConfirm}>
            Approve & Reassign
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Partial Fulfillment Modal */}
      <Modal show={showPartialModal} onHide={() => setShowPartialModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Partially Fulfill Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Available Units</Form.Label>
              <Form.Control 
                type="number" 
                min="1" 
                max={selectedRequest ? selectedRequest.quantity - 1 : 0}
                value={availableUnits}
                onChange={(e) => setAvailableUnits(parseInt(e.target.value) || 0)}
              />
              <Form.Text className="text-muted">
                {selectedRequest ? `Requested: ${selectedRequest.quantity} units` : ''}
              </Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Additional Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={partialFulfillmentNotes}
                onChange={(e) => setPartialFulfillmentNotes(e.target.value)}
                placeholder="Additional details about partial fulfillment"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPartialModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={handlePartialFulfillConfirm}>
            Partially Fulfill
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Request Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Blood Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Reason for cancellation</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this request"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Back
          </Button>
          <Button variant="danger" onClick={handleCancelConfirm}>
            Cancel Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Request Additional Info Modal */}
      <Modal show={showRequestInfoModal} onHide={() => setShowRequestInfoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Additional Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Information Needed</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={infoRequest}
                onChange={(e) => setInfoRequest(e.target.value)}
                placeholder="Please specify what additional information you need from the hospital"
              />
              <Form.Text className="text-muted">
                The request will be paused until the hospital provides this information.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestInfoModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRequestInfoConfirm}>
            Send Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Provide Additional Info Modal */}
      <Modal show={showProvideInfoModal} onHide={() => setShowProvideInfoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Provide Requested Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {selectedRequest && selectedRequest.infoRequest && (
              <div className="alert alert-info mb-3">
                <strong>Information requested:</strong> {selectedRequest.infoRequest}
              </div>
            )}
            <Form.Group>
              <Form.Label>Your Response</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Please provide the requested information"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProvideInfoModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleProvideInfoConfirm}>
            Submit Information
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BloodRequestTable;
