import axios from "axios";
import { apiUrl } from "../config.json";
import { toast } from "react-toastify";

const apiEndpoint = apiUrl + "/bloodRequest";

function getCurrentUserRole() {
  var user = JSON.parse(localStorage.getItem("user"));
  return user ? user.role : null;
}

function getUserData() {
  return JSON.parse(localStorage.getItem("user")) || null;
}

// Helper function to normalize blood request data from MongoDB format
function normalizeBloodRequests(requests) {
  if (!Array.isArray(requests)) {
    console.error("normalizeBloodRequests received non-array:", requests);
    return [];
  }
  
  console.log("Normalizing blood requests array:", requests);
  return requests.map(function(request) {
    return normalizeSingleBloodRequest(request);
  });
}

// Helper function to normalize a single blood request
function normalizeSingleBloodRequest(request) {
  if (!request) {
    console.error("normalizeSingleBloodRequest received empty request");
    return {};
  }
  
  var normalized = { ...request };
  
  // Ensure status is in lowercase to match our component expectations
  if (normalized.status) {
    console.log(`Normalizing status from '${normalized.status}' to lowercase`);
    normalized.status = String(normalized.status).toLowerCase();
  } else {
    console.warn("Request has no status value:", normalized);
    normalized.status = "unknown";
  }

  // Set default priority if not present
  if (!normalized.priority) {
    normalized.priority = "normal";
  }
  
  return normalized;
}

// Helper function to prepare the request data
function prepareRequestData(bloodRequest, userData) {
  var request = { ...bloodRequest };
  
  // IMPORTANT: Backend requires the requester field 
  // Set requester to current user ID from userData
  if (userData && userData._id) {
    request.requester = userData._id;
    console.log("Setting requester ID to:", userData._id);
  }
  
  // Set default status for new requests
  if (!request.status) {
    request.status = "pending";
  }

  // Set default priority if not present
  if (!request.priority) {
    request.priority = "normal";
  }
  
  // Make sure hospitalName is set
  if (!request.hospitalName) {
    // Try to get hospitalName from user data
    if (userData && userData.role === "Hospital Admin" && userData.hospitalName) {
      request.hospitalName = userData.hospitalName;
    } else if (userData && userData.email) {
      // Generate a hospital name from email if nothing else is available
      var emailParts = userData.email.split('@');
      var hospitalDomain = emailParts.length > 1 ? emailParts[1].split('.')[0] : '';
      request.hospitalName = hospitalDomain ? 
        hospitalDomain.charAt(0).toUpperCase() + hospitalDomain.slice(1) + " Hospital" : 
        "Default Hospital";
      console.log("Generated hospital name from email:", request.hospitalName);
    } else {
      // Final fallback
      request.hospitalName = "Default Hospital";
      console.log("Using default hospital name");
    }
  }
  
  // Format the ID if it's an object (MongoDB format)
  if (request._id && typeof request._id === 'object' && request._id.$oid) {
    request._id = request._id.$oid;
  }
  
  // Same for branchId
  if (request.branchId && typeof request.branchId === 'object' && request.branchId.$oid) {
    request.branchId = request.branchId.$oid;
  }
  
  return request;
}

// Ensure authentication is valid before making API calls
function ensureValidAuthentication() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No authentication token found");
    toast.error("Please log in to access this feature");
    return false;
  }
  
  // Check token expiration if possible
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.role) {
      console.error("Invalid user data in localStorage");
      toast.error("Invalid user session, please log in again");
      return false;
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
    toast.error("Session error, please log in again");
    return false;
  }
  
  return true;
}

export function getBloodRequests() {
  var userRole = getCurrentUserRole();
  var endpoint = apiEndpoint;
  var userData = getUserData();

    switch (userRole) {
      case "Super Admin":
        endpoint += "/forwarded/superAdmin";
        break;
      case "Hospital Admin":
      // For Hospital Admin, get their own requests using the correct endpoint
        endpoint += "/forwarded/hospitalAdmin";
      console.log("Hospital Admin viewing blood requests, using endpoint:", endpoint);
        break;
      case "Admin":
        endpoint += "/pending";
        break;
      default:
      console.error("Unknown user role");
      return Promise.reject("Unknown user role");
  }

  return axios.get(endpoint)
    .then(function(response) {
      console.log("Blood requests raw response:", response.data);
      
      // Ensure response.data is always treated as an array, even if empty
      const dataArray = Array.isArray(response.data) ? response.data : [];
      console.log("Converting to array:", dataArray);
      
      // Normalize the blood requests
      const normalizedData = normalizeBloodRequests(dataArray);
      console.log("Normalized blood request data:", normalizedData);
      
      // Return the data in the expected format
      return { data: normalizedData };
    })
    .catch(function(error) {
      console.error("Error fetching blood requests", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      // Return an empty array in the expected format
      return { data: [] };
    });
}

export function getBloodRequestById(id) {
  var endpoint = apiEndpoint + "/" + id;
  
  return axios.get(endpoint)
    .then(function(response) {
      // Normalize the data to ensure consistency
      response.data = normalizeSingleBloodRequest(response.data);
    return response;
    })
    .catch(function(error) {
      console.error("Error fetching blood request:", error);
      toast.error("Error fetching blood request details");
    throw error;
    });
}

export function saveBloodRequest(bloodRequest) {
  var userRole = getCurrentUserRole();
  var userData = getUserData();
  var token = localStorage.getItem("token");

  // Ensure the request has the correct format and required fields
  var requestData = prepareRequestData(bloodRequest, userData);
  
  // Debug: Log the request data being sent
  console.log("Blood request data prepared for API:", requestData);
  console.log("Current user role:", userRole);

  // Setup authorization headers
  var headers = token ? {
    Authorization: "Bearer " + token
  } : {};

  if (bloodRequest._id) {
    // Update existing blood request
    var body = { ...requestData };
    delete body._id;
    var endpoint = apiEndpoint + "/" + bloodRequest._id;
    
    if (userRole === "Super Admin") {
      // Handle approve vs reject actions for Super Admin
      if (requestData.status === "approved") {
        endpoint = apiEndpoint + "/" + bloodRequest._id + "/approve";
        body.superAdminAction = true; // Flag this as a Super Admin approval
        body.actionDate = new Date().toISOString();
        
        // If this is a reassignment (from a forwarded request)
        if (requestData.branchId && requestData.branchId !== bloodRequest.branchId) {
          body.reassignedBranchId = requestData.branchId;
          body.notes = requestData.notes;
          console.log("Super Admin REASSIGNING request to branch:", requestData.branchId);
        }
        
        console.log("Super Admin APPROVING request to endpoint:", endpoint);
      } else if (requestData.status === "rejected") {
        endpoint = apiEndpoint + "/" + bloodRequest._id + "/reject";
        body.superAdminAction = true; // Flag this as a Super Admin rejection
        body.rejectionReason = requestData.rejectionReason; // Include rejection reason
        body.actionDate = new Date().toISOString();
        console.log("Super Admin REJECTING request to endpoint:", endpoint);
      } else {
        console.log("Super Admin performing general update with status:", requestData.status);
      }
    } else if (userRole === "Admin") {
      if (requestData.status === "rejected") {
        endpoint = apiEndpoint + "/" + bloodRequest._id + "/reject";
        body.rejectionReason = requestData.rejectionReason; // Include rejection reason
        console.log("Branch Admin REJECTING request to endpoint:", endpoint);
      } else if (requestData.status === "forwarded") {
        endpoint = apiEndpoint + "/" + bloodRequest._id + "/forward";
        body.reason = requestData.forwardReason; // Include forward reason
        body.notes = requestData.notes;
        console.log("Branch Admin FORWARDING request to endpoint:", endpoint, "with reason:", body.reason);
      } else if (requestData.status === "approved") {
        endpoint = apiEndpoint + "/" + bloodRequest._id + "/approve";
        console.log("Branch Admin APPROVING request to endpoint:", endpoint);
      }
    }
    
    console.log("Updating blood request at endpoint:", endpoint);
    return axios.put(endpoint, body, { headers: headers })
      .then(response => {
        // Force update of the updatedAt field to ensure notifications work
        if (response.data && !response.data.updatedAt) {
          response.data.updatedAt = new Date().toISOString();
        }
        return response;
      })
      .catch(error => {
        console.error("Error updating blood request:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
        }
        throw error;
      });
  } else {
    // Create new blood request
    console.log("Creating new blood request at endpoint:", apiEndpoint);
    console.log("Using authorization headers:", headers);
    return axios.post(apiEndpoint, requestData, { headers: headers })
      .catch(error => {
        console.error("Error creating blood request:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
        }
        throw error;
      });
  }
}

export function updateBloodRequestStatus(requestId, newStatus) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  const headers = {
    Authorization: "Bearer " + token
  };

  const endpoint = `${apiEndpoint}/${requestId}/status/${newStatus}`;
  
  return axios.put(endpoint, {}, { headers: headers })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error(`Error updating blood request status to ${newStatus}:`, error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      throw error;
    });
}

export function partialFulfillRequest(requestId, availableUnits, notes) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  const headers = {
    Authorization: "Bearer " + token
  };

  const endpoint = `${apiEndpoint}/${requestId}/partial-fulfill`;
  const body = {
    fulfilledQuantity: availableUnits,
    notes: notes
  };
  
  return axios.put(endpoint, body, { headers: headers })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error("Error partially fulfilling blood request:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      throw error;
    });
}

export function deleteBloodRequest(bloodRequestId) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  var headers = {
    Authorization: "Bearer " + token
  };

  return axios.delete(apiEndpoint + "/" + bloodRequestId, { headers: headers })
    .catch(function(error) {
      console.error("Error deleting blood request:", error);
      throw error;
    });
}

// Super Admin: Get all blood requests for oversight
export function getAllBloodRequests(filters = {}) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  var headers = {
    Authorization: "Bearer " + token
  };

  var queryString = Object.keys(filters)
    .filter(key => filters[key]) // Remove empty filters
    .map(key => `${key}=${encodeURIComponent(filters[key])}`)
    .join('&');
  
  var endpoint = `${apiEndpoint}/all${queryString ? '?' + queryString : ''}`;
  
  return axios.get(endpoint, { headers: headers })
    .then(function(response) {
      console.log("All blood requests raw response:", response.data);
      
      const dataArray = Array.isArray(response.data) ? response.data : [];
      const normalizedData = normalizeBloodRequests(dataArray);
      
      return { data: normalizedData };
    })
    .catch(function(error) {
      console.error("Error fetching all blood requests", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      toast.error("Failed to fetch blood requests");
      return { data: [] };
    });
}

// Hospital Admin: Cancel a blood request
export function cancelBloodRequest(requestId, reason) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  var headers = {
    Authorization: "Bearer " + token
  };

  const endpoint = `${apiEndpoint}/${requestId}/cancel`;
  const body = {
    reason: reason || "Cancelled by requester"
  };
  
  return axios.put(endpoint, body, { headers: headers })
    .then(response => {
      toast.success("Blood request cancelled successfully");
      return response.data;
    })
    .catch(error => {
      console.error("Error cancelling blood request:", error);
      if (error.response) {
        toast.error(error.response.data || "Failed to cancel request");
      } else {
        toast.error("Failed to cancel blood request");
      }
      throw error;
    });
}

// Branch Admin: Request additional information from Hospital Admin
export function requestAdditionalInfo(requestId, infoRequest) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  var headers = {
    Authorization: "Bearer " + token
  };

  const endpoint = `${apiEndpoint}/${requestId}/request-info`;
  const body = {
    infoRequest: infoRequest
  };
  
  return axios.put(endpoint, body, { headers: headers })
    .then(response => {
      toast.success("Information request sent to hospital");
      return response.data;
    })
    .catch(error => {
      console.error("Error requesting additional information:", error);
      if (error.response) {
        toast.error(error.response.data || "Failed to request information");
      } else {
        toast.error("Failed to request additional information");
      }
      throw error;
    });
}

// Hospital Admin: Provide additional information
export function provideAdditionalInfo(requestId, additionalInfo) {
  var token = localStorage.getItem("token");
  if (!token) {
    toast.error("Authentication required");
    return Promise.reject("No token found");
  }

  var headers = {
    Authorization: "Bearer " + token
  };

  const endpoint = `${apiEndpoint}/${requestId}/provide-info`;
  const body = {
    additionalInfo: additionalInfo
  };
  
  return axios.put(endpoint, body, { headers: headers })
    .then(response => {
      toast.success("Additional information provided successfully");
      return response.data;
    })
    .catch(error => {
      console.error("Error providing additional information:", error);
      if (error.response) {
        toast.error(error.response.data || "Failed to submit information");
      } else {
        toast.error("Failed to provide additional information");
      }
      throw error;
    });
}

// Blood Request Report
export function getBloodRequestReport(filters = {}) {
  if (!ensureValidAuthentication()) {
    return Promise.reject("Authentication failed");
  }

  var token = localStorage.getItem("token");
  var headers = {
    Authorization: "Bearer " + token
  };

  // Get user role to determine which endpoint to use
  var userRole = getCurrentUserRole();
  var endpoint;

  if (userRole === "Super Admin") {
    endpoint = `${apiEndpoint}/all`;
  } else if (userRole === "Admin") {
    endpoint = `${apiEndpoint}/branch-report`;
  } else {
    toast.error("Unauthorized to access reports");
    return Promise.reject("Unauthorized role");
  }

  var queryString = Object.keys(filters)
    .filter(key => filters[key]) // Remove empty filters
    .map(key => `${key}=${encodeURIComponent(filters[key])}`)
    .join('&');
  
  endpoint = `${endpoint}${queryString ? '?' + queryString : ''}`;

  console.log("Generating blood request report with endpoint:", endpoint, "and token:", token ? "Valid" : "Invalid");
  
  return axios.get(endpoint, { headers: headers })
    .then(function(response) {
      console.log("Blood request report raw response:", response.data);
      
      if (!response.data) {
        console.error("Empty response data received");
        return [];
      }
      
      const dataArray = Array.isArray(response.data) ? response.data : [];
      console.log("Data array length:", dataArray.length);
      
      if (dataArray.length === 0) {
        console.log("No blood requests found for the given criteria");
      }
      
      const normalizedData = normalizeBloodRequests(dataArray);
      
      // Process the data for the report format
      return normalizedData.map(request => {
        return {
          requestId: request._id,
          bloodType: request.bloodType,
          quantity: request.quantity,
          hospitalName: request.hospitalName,
          status: request.status,
          priority: request.priority || 'normal',
          branchId: request.branchId,
          requester: request.requester,
          createdAt: request.createdAt || request.updatedAt,
          updatedAt: request.updatedAt,
          notes: request.notes || '',
          fulfilledQuantity: request.fulfilledQuantity || 0
        };
      });
    })
    .catch(function(error) {
      console.error("Error fetching blood request report data:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        
        // Check for auth errors and provide specific messages
        if (error.response.status === 401 || error.response.status === 403) {
          toast.error("Authentication failed. Please log in again.");
        } else {
          toast.error(`Failed to fetch report: ${error.response.data}`);
        }
      } else {
        console.error("Error message:", error.message);
        toast.error("Failed to fetch blood request report data");
      }
      return [];
    });
}

export default {
  getBloodRequests,
  getBloodRequestById,
  saveBloodRequest,
  deleteBloodRequest,
  updateBloodRequestStatus,
  partialFulfillRequest,
  getAllBloodRequests,
  cancelBloodRequest,
  requestAdditionalInfo,
  provideAdditionalInfo,
  getBloodRequestReport
};
