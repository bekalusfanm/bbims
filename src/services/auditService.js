import axios from "axios";
import { toast } from "react-toastify";
import { apiUrl } from "../config.json";

const apiEndpoint = `${apiUrl}/audit`;

// Helper to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return {
    "Authorization": `Bearer ${token}`
  };
}

/**
 * Fetches all audit logs from the server
 * Only accessible to Super Admin users
 */
export async function getAuditLogs() {
  try {
    const headers = getAuthHeaders();
    const { data } = await axios.get(apiEndpoint, { headers });
    return data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    
    if (error.response) {
      if (error.response.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else if (error.response.status === 403) {
        toast.error("You don't have permission to view audit logs.");
      } else {
        toast.error(error.response.data || "Failed to load audit logs");
      }
    } else {
      toast.error("Network error. Please check your connection.");
    }
    
    // Return mock data if in development and API is not yet implemented
    if (process.env.NODE_ENV === 'development') {
      console.log("Using mock audit log data for development");
      return generateMockAuditLogs();
    }
    
    return [];
  }
}

/**
 * Generates mock audit log data for development/testing
 * Only generates logs for the last 30 days
 */
function generateMockAuditLogs() {
  const actions = ["Create", "Update", "Delete", "Login", "Logout", "View"];
  const entityTypes = ["Branch", "Donor", "BloodBag", "User", "BloodRequest"];
  const usernames = ["superadmin", "admin1", "john.doe", "jane.smith", "test.user"];
  const ipAddresses = ["192.168.1.1", "10.0.0.5", "172.16.0.10", "127.0.0.1"];
  
  const logs = [];
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Generate 100 random log entries for the last 30 days only
  for (let i = 0; i < 100; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const username = usernames[Math.floor(Math.random() * usernames.length)];
    const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
    
    // Generate a random timestamp within the last 30 days only
    const timestamp = new Date(currentDate);
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30)); // 0-29 days ago
    timestamp.setHours(Math.floor(Math.random() * 24));
    timestamp.setMinutes(Math.floor(Math.random() * 60));
    
    // Generate a realistic log entry
    const log = {
      timestamp: timestamp.toISOString(),
      username,
      action,
      entityType,
      entityId: generateRandomId(),
      ipAddress,
      details: generateLogDetails(action, entityType)
    };
    
    logs.push(log);
  }
  
  // Sort by timestamp (newest first)
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Helper to generate realistic log details
function generateLogDetails(action, entityType) {
  const details = {
    "Create": `Created new ${entityType.toLowerCase()}`,
    "Update": `Updated ${entityType.toLowerCase()} information`,
    "Delete": `Removed ${entityType.toLowerCase()} from system`,
    "Login": "User logged into system",
    "Logout": "User logged out of system",
    "View": `Viewed ${entityType.toLowerCase()} details`
  };
  
  return details[action] || `Performed ${action} action on ${entityType}`;
}

// Helper to generate random MongoDB-like ID
function generateRandomId() {
  let id = '';
  const chars = 'abcdef0123456789';
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export default {
  getAuditLogs
}; 