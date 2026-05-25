import axios from "axios";
import { toast } from "react-toastify";
import http from "./httpService"; // Assuming you have a httpService module for axios config
import { apiUrl } from "../config.json";

// Define both endpoints
const readEndpoint = `${apiUrl}/branches/locations`; // Non-authenticated endpoint for reading
const adminEndpoint = `${apiUrl}/branches`; // Authenticated endpoint for CRUD operations

export async function getAllBranches() {
  try {
    console.log("Fetching branches from:", readEndpoint);
    
    // Try to fetch from the /locations endpoint which has no middleware restrictions
    const response = await axios.get(readEndpoint);
    console.log("Branches received:", response.data);
    
    if (response.data && Array.isArray(response.data)) {
      if (response.data.length === 0) {
        console.warn("Server returned empty branches array");
        toast.warning("No branches found in the system. Contact a Super Admin to create branches.");
      }
      return response.data;
    } else {
      console.warn("Server returned non-array data:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching branches:", error);
    toast.error("Failed to fetch branches from the server");
    // Return empty array instead of throwing error
    return [];
  }
}

export const AllBranches = async () => {
  try {
    const { data } = await axios.get(readEndpoint);
    return data;
  } catch (error) {
    console.error("Error fetching locations", error);
    throw error;
  }
};

export async function getBranchById(id) {
  try {
    const { data } = await axios.get(`${readEndpoint}/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching branch with ID ${id}`, error);
    // Return a basic branch object instead of throwing an error
    return {
      _id: id,
      name: "Unknown Branch",
      location: "Unknown",
      contact: ""
    };
  }
}

export async function saveBranch(branch) {
  try {
    const token = localStorage.getItem("token");
    console.log("Attempting to save branch with token:", token ? "Token exists" : "No token");
    
    if (!token) {
      console.log("No token found, cannot create branch");
      toast.error("Authentication required. Please log in again.");
      return null;
    }

    // Ensure proper authorization header format
    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Use the admin endpoint which has the proper middleware
    const endpoint = branch._id ? 
      `${adminEndpoint}/${branch._id}` : 
      adminEndpoint;
    
    console.log("Saving branch to:", endpoint);
    
    try {
      let response;
      
      if (branch._id) {
        // Updating an existing branch
        const body = { ...branch };
        delete body._id;
        response = await axios.put(endpoint, body, { headers });
      } else {
        // Creating a new branch
        console.log("Creating new branch with data:", branch);
        console.log("Using headers:", headers);
        response = await axios.post(endpoint, branch, { headers });
      }
      
      if (response && response.data) {
        console.log("Branch operation successful:", response.data);
        toast.success(branch._id ? "Branch updated successfully" : "Branch created successfully");
        return response.data;
      } else {
        console.error("Empty response when saving branch");
        toast.error("Failed to save branch: No response from server");
        return null;
      }
    } catch (serverError) {
      console.error("Server error when saving branch:", serverError);
      if (serverError.response) {
        console.error("Response status:", serverError.response.status);
        console.error("Response data:", serverError.response.data);
        toast.error(`Failed to save branch: ${serverError.response.data || serverError.message}`);
      } else {
        toast.error(`Failed to save branch: ${serverError.message || "Unknown error"}`);
      }
      return null;
    }
  } catch (error) {
    console.error("Error in saveBranch:", error);
    toast.error(`Failed to save branch: ${error.message || "Unknown error"}`);
    return null;
  }
}

export async function deleteBranch(id) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      throw new Error("No token found");
    }

    // Use consistent authorization header format
    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Use the admin endpoint with proper middleware
    const response = await axios.delete(`${adminEndpoint}/${id}`, { headers });
    
    if (response && response.status === 200) {
      console.log("Branch deleted successfully:", response.data);
      toast.success("Branch deleted successfully");
      return true;
    } else {
      console.warn("Unexpected response:", response);
      toast.warning("Unexpected response when deleting branch");
      return false;
    }
  } catch (error) {
    console.error("Error deleting branch", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      toast.error(`Failed to delete branch: ${error.response.data || error.message}`);
    } else {
      toast.error(`Failed to delete branch: ${error.message || "Unknown error"}`);
    }
    return false;
  }
}

export default {
  getAllBranches,
  getBranchById,
  saveBranch,
  deleteBranch,
};
