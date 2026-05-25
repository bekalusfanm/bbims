import axios from "axios";
import { toast } from "react-toastify";
import { apiUrl } from "../config.json";
import http from "./httpService";

const apiEndpoint = `${apiUrl}/inventory`;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to continue");
    throw new Error("No authentication token found");
  }
  return {
    "Authorization": `Bearer ${token}`
  };
}

export const getBloodBags = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      throw new Error("No user data found");
    }

    console.log("Fetching blood bags for user role:", user.role);
    
    const response = await axios.get(apiEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Don't reject if status is less than 500
      }
    });

    console.log("API Response Status:", response.status);
    console.log("API Response Data:", response.data);

    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }

    if (response.status === 403) {
      throw new Error("You don't have permission to access this resource.");
    }

    if (response.status === 404) {
      throw new Error("API endpoint not found. Please check if the backend server is running.");
    }

    if (response.status === 500) {
      throw new Error("Internal server error. Please try again later.");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching blood bags:", error);
    if (error.response) {
      console.error("Error Response Status:", error.response.status);
      console.error("Error Response Data:", error.response.data);
      throw new Error(error.response.data || "Failed to fetch blood bags");
    }
    throw error;
  }
};

export const getBloodBag = async (id) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(`${apiEndpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching blood bag:", error);
    toast.error("Failed to fetch blood bag details");
    throw error;
  }
};

export const saveBloodBag = async (bloodBag) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Format the data according to backend requirements
    const formattedData = {
      bloodType: bloodBag.bloodType.split('+')[0].split('-')[0], // Remove the + or - from blood type
      bloodCollector: bloodBag.bloodCollector,
      collectionDate: bloodBag.collectionDate,
      expiryDate: bloodBag.expiryDate,
      donorId: bloodBag.donorId,
      locationCollected: bloodBag.locationCollected,
      branchId: bloodBag.branchId
    };

    console.log("Attempting to save blood bag...");
    console.log("API Endpoint:", apiEndpoint);
    console.log("Formatted Request Data:", formattedData);
    console.log("Auth Token:", token.substring(0, 20) + "...");

    const response = await axios.post(apiEndpoint, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Don't reject if status is less than 500
      }
    });

    console.log("API Response Status:", response.status);
    console.log("API Response Data:", response.data);

    if (response.status === 404) {
      throw new Error("API endpoint not found. Please check if the backend server is running.");
    }

    if (response.status === 400) {
      throw new Error(response.data || "Invalid data format. Please check the form fields.");
    }

    toast.success("Blood bag saved successfully");
    return response.data;
  } catch (error) {
    console.error("Error saving blood bag:", error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error Response Status:", error.response.status);
      console.error("Error Response Data:", error.response.data);
      console.error("Error Response Headers:", error.response.headers);
      
      if (error.response.status === 404) {
        toast.error("Backend server not found. Please ensure the server is running on port 4000.");
      } else if (error.response.status === 401) {
        toast.error("Authentication failed. Please log in again.");
      } else if (error.response.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (error.response.status === 400) {
        toast.error(error.response.data || "Invalid data format. Please check the form fields.");
      } else {
        toast.error(error.response.data.message || "Failed to save blood bag");
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
      toast.error("No response from server. Please check if the backend server is running.");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request:", error.message);
      toast.error("Failed to set up request. Please try again.");
    }
    throw error;
  }
};

export const updateBloodBag = async (id, bloodBag) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.put(`${apiEndpoint}/${id}`, bloodBag, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    toast.success("Blood bag updated successfully");
    return response.data;
  } catch (error) {
    console.error("Error updating blood bag:", error);
    toast.error("Failed to update blood bag");
    throw error;
  }
};

export const deleteBloodBag = async (id) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    await axios.delete(`${apiEndpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    toast.success("Blood bag deleted successfully");
  } catch (error) {
    console.error("Error deleting blood bag:", error);
    toast.error("Failed to delete blood bag");
    throw error;
  }
};

export const getBloodBagsByBranch = async (branchId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(`${apiEndpoint}/branch/${branchId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching blood bags by branch:", error);
    toast.error("Failed to fetch blood bags for branch");
    throw error;
  }
};

export const getBloodBagsByBloodType = async (bloodType) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(`${apiEndpoint}/blood-type/${bloodType}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching blood bags by blood type:", error);
    toast.error("Failed to fetch blood bags by blood type");
    throw error;
  }
};

export const getBloodBagsByStatus = async (status) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axios.get(`${apiEndpoint}/status/${status}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching blood bags by status:", error);
    toast.error("Failed to fetch blood bags by status");
    throw error;
  }
};

// Get all inventory
export async function getAllInventory() {
  try {
    console.log("Fetching all inventory from API");
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return [];
    }

    const response = await axios.get(apiEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept status codes less than 500
      }
    });

    console.log("API Response Status:", response.status);
    
    if (response.status === 200) {
      console.log(`Successfully fetched ${response.data.length} inventory items`);
      return response.data;
    } else {
      console.error("Error fetching inventory:", response.status, response.data);
      toast.error(`Failed to fetch inventory: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching all inventory:", error);
    toast.error("Failed to fetch inventory data");
    return [];
  }
}

// Get inventory report
export async function getInventoryReport(branchId, timeRange) {
  try {
    console.log("Generating inventory report:", branchId, timeRange);
    
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return [];
    }

    // Define the API endpoint for inventory reports
    let endpoint = `${apiEndpoint}/report`;
    
    // Add query parameters for filtering
    const params = new URLSearchParams();
    if (branchId) {
      params.append('branchId', branchId);
    }
    if (timeRange) {
      params.append('timeRange', timeRange);
    }
    
    // Append parameters to endpoint if they exist
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    console.log("Fetching inventory report from API endpoint:", endpoint);
    
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept status codes less than 500
      }
    });
    
    if (response.status === 200) {
      console.log(`Successfully fetched inventory report with ${response.data.length} items`);
      return response.data;
    } 
    
    // If API endpoint is not available, fallback to processing the data locally
    console.log("Report endpoint not available, processing inventory data locally");
    
    // Get the current inventory
    const inventory = await getAllInventory();
    
    // Filter by branch if provided
    let filteredInventory = inventory;
    if (branchId) {
      filteredInventory = inventory.filter(function(item) {
        return item.branchId === branchId;
      });
    }
    
    // Group by blood type
    const bloodTypeGroups = {};
    filteredInventory.forEach(function(item) {
      if (!bloodTypeGroups[item.bloodType]) {
        bloodTypeGroups[item.bloodType] = {
          bloodType: item.bloodType,
          quantity: 0,
          updatedAt: item.updatedAt || new Date().toISOString()
        };
      }
      bloodTypeGroups[item.bloodType].quantity += item.quantity || 0;
    });
    
    // Convert to array
    const result = [];
    for (const type in bloodTypeGroups) {
      result.push(bloodTypeGroups[type]);
    }
    
    return result;
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return [];
  }
}

// Get blood type distribution
export async function getBloodTypeDistribution(branchId) {
  try {
    console.log("Fetching blood type distribution:", branchId);
    
    // Get inventory report which already has quantities by blood type
    const inventoryReport = await getInventoryReport(branchId);
    
    // Calculate total
    let total = 0;
    inventoryReport.forEach(function(item) {
      total += item.quantity;
    });
    
    // Calculate percentages
    return inventoryReport.map(function(item) {
      return {
        type: item.bloodType,
        quantity: item.quantity,
        percentage: total > 0 ? Math.round((item.quantity / total) * 100) : 0
      };
    });
  } catch (error) {
    console.error("Error generating blood type distribution:", error);
    return [];
  }
}

// Mock data for inventory
function getMockInventory() {
  console.log("Generating initial mock inventory data");
  
  // Check if we already have mock data in localStorage
  try {
    const storageData = localStorage.getItem('mockInventory');
    if (storageData) {
      const parsedData = JSON.parse(storageData);
      if (parsedData && parsedData.length > 0) {
        console.log("Using existing mock inventory from localStorage");
        return parsedData;
      }
    }
  } catch (e) {
    console.error("Error reading existing mock inventory:", e);
  }
  
  // Default mock inventory data
  const inventory = [
    {
      _id: "bag_001",
      bloodType: "A+",
      quantity: 15,
      branchId: "branch001",
      collectionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      bloodCollector: "John Doe",
      donorId: "donor001",
      locationCollected: "Central Blood Bank",
      updatedAt: new Date().toISOString()
    },
    {
      _id: "bag_002",
      bloodType: "O-",
      quantity: 8,
      branchId: "branch001",
      collectionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      bloodCollector: "Jane Smith",
      donorId: "donor002",
      locationCollected: "Central Blood Bank",
      updatedAt: new Date().toISOString()
    },
    {
      _id: "bag_003",
      bloodType: "B+",
      quantity: 12,
      branchId: "branch002",
      collectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      bloodCollector: "Robert Johnson",
      donorId: "donor003",
      locationCollected: "North Branch",
      updatedAt: new Date().toISOString()
    },
    {
      _id: "bag_004",
      bloodType: "AB+",
      quantity: 5,
      branchId: "branch001",
      collectionDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      bloodCollector: "Sarah Williams",
      donorId: "donor004",
      locationCollected: "Central Blood Bank",
      updatedAt: new Date().toISOString()
    },
    {
      _id: "bag_005",
      bloodType: "O+",
      quantity: 20,
      branchId: "branch003",
      collectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      bloodCollector: "Michael Brown",
      donorId: "donor005",
      locationCollected: "South Branch",
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Save to localStorage for persistence
  try {
    localStorage.setItem('mockInventory', JSON.stringify(inventory));
    console.log("Saved initial mock inventory to localStorage");
  } catch (e) {
    console.error("Error saving initial mock inventory to localStorage:", e);
  }
  
  return inventory;
}

export default {
  getAllInventory,
  getBloodBag,
  getBloodBags,
  saveBloodBag,
  deleteBloodBag,
  getInventoryReport,
  getBloodTypeDistribution
};
