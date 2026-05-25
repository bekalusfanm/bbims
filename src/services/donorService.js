import axios from "axios";
import { toast } from "react-toastify";
import { apiUrl } from "../config.json";
import http from "./httpService";

const apiEndpoint = `${apiUrl}/donors`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to continue");
    throw new Error("No authentication token found");
  }
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

export async function getDonors() {
  try {
    const headers = getAuthHeaders();
    console.log("Fetching donors with headers:", headers);
    
    // Get current user to check role and branch ID
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.error("User information not found. Please log in again.");
      return [];
    }
    
    // Log user info for debugging
    console.log("Current user:", user);
    
    // Check if user has a branch ID
    if (!user.branchId && user.role !== "Super Admin") {
      toast.warning("You're not assigned to any branch. Contact an administrator.");
      console.log("User has no branch ID:", user);
      return [];
    }
    
    const { data } = await axios.get(apiEndpoint, { headers });
    console.log("Fetched donors:", data);
    
    if (!data || data.length === 0) {
      if (user.role === "Staff Member") {
        toast.info("No donors found for your branch. Please register new donors.");
      } else {
        toast.info("No donors found in the database.");
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching donors:", error.response || error);
    
    if (error.response) {
      if (error.response.status === 401) {
        toast.error("You are not authorized. Please log in again.");
      } else if (error.response.status === 403) {
        toast.error("You don't have permission to view donors.");
      } else if (error.response.data) {
        toast.error(error.response.data);
      } else {
        toast.error("Error fetching donors. Please try again.");
      }
    } else {
      toast.error("Network error. Please check your connection.");
    }
    
    return []; // Return empty array instead of throwing
  }
}

export async function getDonor(id) {
  try {
    const headers = getAuthHeaders();
    console.log("Fetching donor by ID:", id);
    const response = await axios.get(`${apiEndpoint}/${id}`, { headers });
    console.log("Got donor data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching donor:", error.response || error);
    const errorMessage = error.response && error.response.data 
      ? error.response.data 
      : "Error fetching donor details";
    toast.error(errorMessage);
    throw error;
  }
}

export async function saveDonor(donor) {
  try {
    const headers = getAuthHeaders();
    console.log("Saving donor data:", donor);

    let response;
    if (donor._id) {
      // Update existing donor
      const body = { ...donor };
      delete body._id;
      console.log("Updating donor with ID:", donor._id);
      response = await axios.put(
        `${apiEndpoint}/${donor._id}`, 
        JSON.stringify(body), 
        { headers }
      );
      toast.success("Donor updated successfully");
    } else {
      // Create new donor
      console.log("Creating new donor with data:", donor);
      response = await axios.post(
        apiEndpoint, 
        JSON.stringify(donor), 
        { headers }
      );
      toast.success("Donor created successfully");
    }

    console.log("Save response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error saving donor:", error.response || error);
    if (error.response && error.response.status === 403) {
      toast.error("You don't have permission to perform this action. Please ensure you're logged in as staff.");
    } else if (error.response && error.response.data) {
      toast.error(error.response.data);
    } else {
      toast.error("Error saving donor. Please try again.");
    }
    throw error;
  }
}

export async function deleteDonor(donorId) {
  try {
    const headers = getAuthHeaders();
    console.log("Deleting donor with ID:", donorId);
    await axios.delete(`${apiEndpoint}/${donorId}`, { headers });
    toast.success("Donor deleted successfully");
  } catch (error) {
    console.error("Error deleting donor:", error.response || error);
    const errorMessage = error.response && error.response.data 
      ? error.response.data 
      : "Error deleting donor";
    toast.error(errorMessage);
    throw error;
  }
}

// Get all donors
export async function getAllDonors() {
  try {
    const { data } = await http.get(apiEndpoint);
    return data;
  } catch (error) {
    console.error("Error fetching donors:", error);
    return getMockDonors();
  }
}

// Get donor by ID
export async function getDonorById(id) {
  try {
    const { data } = await http.get(`${apiEndpoint}/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching donor with id ${id}:`, error);
    const mockDonors = getMockDonors();
    return mockDonors.find(donor => donor._id === id) || null;
  }
}

// Add donor
export async function addDonor(donor) {
  try {
    const { data } = await http.post(apiEndpoint, donor);
    return data;
  } catch (error) {
    console.error("Error adding donor:", error);
    return mockAddDonor(donor);
  }
}

// Update donor
export async function updateDonor(id, donor) {
  try {
    const { data } = await http.put(`${apiEndpoint}/${id}`, donor);
    return data;
  } catch (error) {
    console.error(`Error updating donor with id ${id}:`, error);
    return mockUpdateDonor(id, donor);
  }
}

// Delete donor
export async function deleteDonorById(id) {
  try {
    await http.delete(`${apiEndpoint}/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting donor with id ${id}:`, error);
    return mockDeleteDonor(id);
  }
}

// Get donor report
export async function getDonorReport(branchId, timeRange) {
  try {
    const headers = getAuthHeaders();
    console.log("Fetching donor report data with filters:", { branchId, timeRange });
    
    // Construct query parameters
    let url = `${apiEndpoint}/report`;
    const params = new URLSearchParams();
    
    if (branchId) {
      params.append('branchId', branchId);
    }
    
    if (timeRange) {
      params.append('timeRange', timeRange);
    }
    
    // Add query parameters if any exist
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log("Fetching donor report from API endpoint:", url);
    
    const response = await axios.get(url, { headers });
    console.log(`Successfully fetched donor report with ${response.data.length} items`);
    return response.data;
  } catch (error) {
    console.error("Error fetching donor report:", error.response || error);
    
    if (error.response && error.response.status === 404) {
      console.warn("Donor report endpoint not found, using getDonors API as fallback");
      
      // Fallback to getting all donors and filtering them
      try {
        const donors = await getDonors();
        console.log(`Fetched ${donors.length} donors for report fallback`);
        
        // Filter by branch if provided
        let filteredDonors = donors;
        if (branchId) {
          filteredDonors = donors.filter(donor => donor.branchId === branchId);
          console.log(`Filtered to ${filteredDonors.length} donors for branch ${branchId}`);
        }
        
        // Process donors into report format
        return filteredDonors.map(donor => ({
          donorName: `${donor.firstName} ${donor.lastName}`,
          bloodType: donor.bloodType,
          donationDate: donor.lastDonation || new Date().toISOString(),
          amount: donor.lastDonationAmount || 450,
          branchId: donor.branchId,
          branchName: donor.branchName || 'Unknown Branch'
        }));
      } catch (fallbackError) {
        console.error("Error with fallback donor report:", fallbackError);
        toast.error("Failed to generate donor report");
        return [];
      }
    } else {
      toast.error("Failed to generate donor report");
      return [];
    }
  }
}

// Mock data functions
function getMockDonors() {
  return [
    {
      _id: "donor1",
      name: "John Doe",
      gender: "Male",
      age: 35,
      bloodType: "O+",
      contactDetails: {
        phone: "123-456-7890",
        email: "john.doe@example.com",
        address: "123 Main St"
      },
      lastDonation: new Date(2023, 3, 10),
      donationCount: 5,
      branchId: "branch1",
      branchName: "Main Branch"
    },
    {
      _id: "donor2",
      name: "Jane Smith",
      gender: "Female",
      age: 28,
      bloodType: "A-",
      contactDetails: {
        phone: "987-654-3210",
        email: "jane.smith@example.com",
        address: "456 Oak Ave"
      },
      lastDonation: new Date(2023, 4, 5),
      donationCount: 3,
      branchId: "branch2",
      branchName: "North Branch"
    }
  ];
}

function mockAddDonor(donor) {
  return {
    ...donor,
    _id: "mock_" + Date.now(),
    donationCount: 0,
    lastDonation: null
  };
}

function mockUpdateDonor(id, donor) {
  return {
    ...donor,
    _id: id
  };
}

function mockDeleteDonor(id) {
  return true;
}

function getMockDonorReport(branchId, timeRange) {
  const today = new Date();
  const data = [];
  
  // Generate dates based on time range
  let days = 7;
  if (timeRange === "month") days = 30;
  if (timeRange === "quarter") days = 90;
  if (timeRange === "year") days = 365;
  
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const branches = [
    { id: "branch1", name: "Main Branch" },
    { id: "branch2", name: "North Branch" },
    { id: "branch3", name: "South Branch" }
  ];
  const donorNames = [
    "John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", 
    "Michael Wilson", "Sarah Brown", "David Miller", "Lisa Taylor"
  ];
  
  // Generate random data
  for (let i = 0; i < days; i++) {
    // Add more donations for more recent days
    const donationsPerDay = Math.floor(Math.random() * 3) + (i < 7 ? 3 : i < 14 ? 2 : 1);
    
    for (let j = 0; j < donationsPerDay; j++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const randomBranchIndex = Math.floor(Math.random() * branches.length);
      const branch = branches[randomBranchIndex];
      
      // Skip if a specific branch is requested and doesn't match
      if (branchId !== "all" && branchId !== branch.id) continue;
      
      const donorName = donorNames[Math.floor(Math.random() * donorNames.length)];
      const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
      const amount = (Math.floor(Math.random() * 10) + 45) * 10; // 450-550 mL
      
      data.push({
        donorName,
        bloodType,
        donationDate: date,
        amount,
        branchId: branch.id,
        branchName: branch.name
      });
    }
  }
  
  return data;
}

export default {
  getAllDonors,
  getDonorById,
  addDonor,
  updateDonor,
  deleteDonor,
  deleteDonorById,
  getDonorReport
};
