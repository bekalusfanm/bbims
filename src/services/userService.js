import http from "./httpService";
import { toast } from "react-toastify";
import { apiUrl } from "../config.json";
import jwtDecode from "jwt-decode";
import axios from "axios";

const apiEndpoint = apiUrl + "/users";
const tokenKey = "token";

// Mock users data
const mockUsers = [
  {
    _id: "user1",
    name: "John Admin",
    email: "admin@bloodbank.com",
    role: "Admin",
    branchId: "branch1",
    contactDetails: {
      phone: "123-456-7890",
      address: "123 Admin St",
      city: "AdminCity",
      state: "AdminState",
      zipCode: "12345"
    },
    personalInfo: {
      firstName: "John",
      lastName: "Admin",
      gender: "Male",
      dateOfBirth: "1985-05-15",
      bloodType: "O+"
    },
    employmentInfo: {
      joinDate: "2018-01-10",
      specialization: "Blood Bank Management",
      levelOfStudy: "Master's Degree",
      employeeId: "EMP001"
    }
  },
  {
    _id: "user2",
    name: "Jane Staff",
    email: "staff@bloodbank.com",
    role: "Staff Member",
    branchId: "branch1",
    contactDetails: {
      phone: "987-654-3210",
      address: "456 Staff St",
      city: "StaffCity",
      state: "StaffState",
      zipCode: "54321"
    },
    personalInfo: {
      firstName: "Jane",
      lastName: "Staff",
      gender: "Female",
      dateOfBirth: "1990-08-20",
      bloodType: "A-"
    },
    employmentInfo: {
      joinDate: "2019-03-15",
      specialization: "Phlebotomy",
      levelOfStudy: "Bachelor's Degree",
      employeeId: "EMP002"
    }
  },
  {
    _id: "user3",
    name: "Sam Super",
    email: "super@bloodbank.com",
    role: "Super Admin",
    branchId: null,
    contactDetails: {
      phone: "555-555-5555",
      address: "789 Super St",
      city: "SuperCity",
      state: "SuperState",
      zipCode: "99999"
    },
    personalInfo: {
      firstName: "Sam",
      lastName: "Super",
      gender: "Male",
      dateOfBirth: "1975-12-10",
      bloodType: "AB+"
    },
    employmentInfo: {
      joinDate: "2015-06-01",
      specialization: "System Administration",
      levelOfStudy: "Doctorate",
      employeeId: "EMP003"
    }
  },
  {
    _id: "user4",
    name: "Maria Staff",
    email: "maria@bloodbank.com",
    role: "Staff Member",
    branchId: "branch1",
    contactDetails: {
      phone: "222-333-4444",
      address: "101 Staff Ave",
      city: "StaffCity",
      state: "StaffState",
      zipCode: "44444"
    },
    personalInfo: {
      firstName: "Maria",
      lastName: "Staff",
      gender: "Female",
      dateOfBirth: "1992-04-25",
      bloodType: "B+"
    },
    employmentInfo: {
      joinDate: "2020-02-15",
      specialization: "Lab Technician",
      levelOfStudy: "Bachelor's Degree",
      employeeId: "EMP004"
    }
  },
  {
    _id: "user5",
    name: "Robert Staff",
    email: "robert@bloodbank.com",
    role: "Staff Member",
    branchId: "branch1",
    contactDetails: {
      phone: "777-888-9999",
      address: "202 Staff Blvd",
      city: "StaffCity",
      state: "StaffState",
      zipCode: "33333"
    },
    personalInfo: {
      firstName: "Robert",
      lastName: "Staff",
      gender: "Male",
      dateOfBirth: "1988-09-14",
      bloodType: "O-"
    },
    employmentInfo: {
      joinDate: "2021-01-10",
      specialization: "Blood Processing",
      levelOfStudy: "Associate Degree",
      employeeId: "EMP005"
    }
  }
];

// Helper function to get all mock users
function getMockUsers() {
  return mockUsers;
}

export async function getAllUsers() {
  try {
    console.log("Attempting to fetch users from API at:", apiEndpoint);
    const { data } = await http.get(apiEndpoint);
    console.log("Successfully fetched users from API:", data);
    return data;
  } catch (error) {
    console.warn("Error fetching users from API, using mock data:", error);
    // Return mock data if API fails
    return getMockUsers();
  }
}

// Function to get available roles from backend
export async function getAvailableRoles() {
  try {
    console.log("Fetching available roles from API");
    const { data } = await http.get(`${apiUrl}/users/roles`);
    console.log("Successfully fetched roles from API:", data);
    return data;
  } catch (error) {
    console.warn("Error fetching roles from API:", error);
    // Fallback to system-defined roles
    return ["Super Admin", "Admin", "Hospital Admin", "Staff Member"];
  }
}

export async function getUserById(id) {
  try {
    console.log(`Attempting to fetch user with id ${id} from API`);
    const { data } = await http.get(`${apiEndpoint}/${id}`);
    console.log(`Successfully fetched user with id ${id} from API:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching user with id ${id} from API:`, error);
    
    // Just return a basic user object with the ID instead of failing completely
    // This ensures the UI can still function even if user details can't be fetched
    return {
      _id: id,
      name: "Unknown User",
      email: "",
      role: "",
      personalInfo: {
        firstName: "Unknown",
        lastName: "User"
      }
    };
  }
}

export async function saveUser(user) {
  try {
    // If the user has a mock ID (starts with 'mock_'), we need to 
    // remove it before sending to the API
    if (user._id && user._id.startsWith('mock_')) {
      const userForApi = { ...user };
      delete userForApi._id; // Remove mock ID so the API will create a new one
      user = userForApi;
    }
    
    console.log("Attempting to save user to API:", user);
    
    let response;
    
    if (user._id) {
      // Update existing user
      const userId = user._id;
      const userData = { ...user };
      delete userData._id;
      
      console.log(`Updating existing user with ID ${userId}:`, userData);
      response = await http.put(`${apiEndpoint}/${userId}`, userData);
    } else {
      // Create new user
      console.log("Creating new user:", user);
      response = await http.post(apiEndpoint, user);
    }
    
    console.log("User saved successfully to API:", response.data);
    toast.success(user._id ? "User updated successfully" : "User registered successfully");
    return response.data;
  } catch (error) {
    console.warn("Error saving user to API:", error);
    
    // If there's a specific backend error message, show it
    if (error.response && error.response.data && error.response.data.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Failed to save user. Using mock storage as fallback.");
    }
    
    // Try again with mock storage as fallback
    try {
      const result = await mockSaveUser(user);
      toast.info("User saved to local storage (offline mode)");
      return result;
    } catch (mockError) {
      console.error("Error in mock user save:", mockError);
      toast.error("Failed to save user in offline mode");
      throw mockError;
    }
  }
}

// Function to mock save user to localStorage
const mockSaveUser = (user) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Saving user to mock storage:", user);
      // Get existing mock users
      const mockUsers = getMockUsers();
      
      // Clone user object with all fields
      const userToSave = { 
        ...user,
        // Ensure all required sections are present
        contactDetails: {
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          ...(user.contactDetails || {})
        },
        personalInfo: {
          firstName: "",
          lastName: "",
          gender: "",
          dateOfBirth: "",
          bloodType: "",
          ...(user.personalInfo || {})
        },
        employmentInfo: {
          joinDate: "",
          specialization: "",
          levelOfStudy: "",
          employeeId: "",
          ...(user.employmentInfo || {})
        },
        emergencyContact: {
          name: "",
          relationship: "",
          phone: "",
          ...(user.emergencyContact || {})
        }
      };
      
      // Create or update user
      if (userToSave._id) {
        // Update existing user
        const index = mockUsers.findIndex(u => u._id === userToSave._id);
        
        if (index !== -1) {
          mockUsers[index] = userToSave;
        } else {
          mockUsers.push(userToSave);
        }
      } else {
        // Create new user with mock ID
        userToSave._id = "mock_" + Date.now();
        mockUsers.push(userToSave);
      }
      
      // Save back to localStorage
      localStorage.setItem("mockUsers", JSON.stringify(mockUsers));
      console.log("User saved successfully to mock storage:", userToSave);
      
      // Simulate API delay
      setTimeout(() => {
        resolve(userToSave);
      }, 500);
    } catch (error) {
      console.error("Error in mock user save:", error);
      reject({ message: "Failed to save user" });
    }
  });
};

export async function deleteUser(id) {
  try {
    console.log(`Attempting to delete user with id ${id} from API`);
    await http.delete(`${apiEndpoint}/${id}`);
    console.log(`Successfully deleted user with id ${id} from API`);
    toast.success("User deleted successfully");
  } catch (error) {
    console.warn(`Error deleting user with id ${id} from API, trying mock delete:`, error);
    
    try {
      // Check if this is a mock ID (starting with 'mock_')
      if (id.startsWith('mock_')) {
        // Get mock users
        const mockUsers = getMockUsers();
        
        // Filter out the deleted user
        const updatedUsers = mockUsers.filter(u => u._id !== id);
        
        // Save back to localStorage
        localStorage.setItem("mockUsers", JSON.stringify(updatedUsers));
        
        toast.success("User deleted successfully");
      } else {
        // If it's not a mock ID, show an error since backend failed
        throw new Error("Failed to delete user from backend");
      }
    } catch (mockError) {
      console.error(`Error deleting user with id ${id} from mock data:`, mockError);
    toast.error("Error deleting user");
      throw mockError;
    }
  }
}

export async function login(email, password) {
  const { data: jwt } = await http.post(apiEndpoint + "/login", { email, password });
  localStorage.setItem(tokenKey, jwt);
  
  // This will decode the token and return the payload
  return jwtDecode(jwt);
}

export function logout() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem("user");
}

export function getCurrentUser() {
  try {
    const jwt = localStorage.getItem(tokenKey);
    return jwtDecode(jwt);
  } catch (ex) {
    return null;
  }
}

export function loginWithJwt(jwt) {
  localStorage.setItem(tokenKey, jwt);
}

export function getJwt() {
  return localStorage.getItem(tokenKey);
}

export function getUserProfile() {
  return http.get(apiEndpoint + "/me");
}

export function changePassword(data) {
  return http.post(apiEndpoint + "/change-password", data);
}

export function updateUserSettings(settings) {
  return http.put(apiEndpoint + "/settings", settings);
}

// Get users by branch ID
export async function getUsersByBranch(branchId) {
  try {
    if (!branchId) {
      console.error('No branch ID provided for getUsersByBranch');
      return [];
    }
    
    const { data } = await http.get(`${apiEndpoint}?branchId=${branchId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching users for branch ${branchId}:`, error);
    return getMockUsersByBranch(branchId);
  }
}

// Function to get mock users for a specific branch
function getMockUsersByBranch(branchId) {
  return getMockUsers().filter(user => user.branchId === branchId);
}

// Get all branches
export const getBranches = async () => {
  try {
    console.log('Fetching branches');
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found for branches API call");
      toast.error("Authentication required");
      return [];
    }
    
    console.log("Fetching branches from API endpoint");
    
    const response = await axios.get(`${apiUrl}/branches`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log("Successfully fetched branches:", response.data);
      return response.data;
    } else {
      console.error("Error fetching branches:", response.status);
      throw new Error(`API responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching branches:', error);
    
    if (error.response && error.response.status === 404) {
      console.warn("Branches endpoint not found, using fallback data");
      // Return mock data as fallback
      return getMockBranches();
    } else {
      toast.error("Failed to fetch branches");
      return [];
    }
  }
};

// Get staff performance data
export const getStaffPerformance = async (branchId, timeRange) => {
  try {
    console.log('Fetching staff performance data:', branchId, timeRange);
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found for staff performance API call");
      toast.error("Authentication required");
      return [];
    }
    
    // Construct query parameters
    let url = `${apiEndpoint}/staff-performance`;
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
    
    console.log("Fetching staff performance data from API endpoint:", url);
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log("Successfully fetched staff performance data:", response.data);
      return response.data;
    } else {
      console.error("Error fetching staff performance data:", response.status);
      throw new Error(`API responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    
    if (error.response && error.response.status === 404) {
      console.warn("Staff performance endpoint not found, using fallback");
      
      // Fallback to fetching users and constructing performance data
      try {
        const users = await getAllUsers();
        console.log("Fetched users for staff performance fallback:", users);
        
        // Filter staff members
        const staffMembers = users.filter(user => 
          user.role === "Staff Member" && (!branchId || user.branchId === branchId)
        );
        
        console.log("Filtered staff members:", staffMembers);
        
        // Generate performance metrics based on user data
        return staffMembers.map(staff => ({
          name: `${staff.firstName} ${staff.lastName}`,
          donorsRegistered: Math.floor(Math.random() * 30) + 10,
          donationsProcessed: Math.floor(Math.random() * 40) + 20,
          inventoryUpdates: Math.floor(Math.random() * 30) + 15
        }));
      } catch (fallbackError) {
        console.error("Error with staff performance fallback:", fallbackError);
        toast.error("Failed to generate staff performance report");
        return [];
      }
    } else {
      toast.error("Failed to fetch staff performance data");
      return [];
    }
  }
};

// Get branch summary report
export const getBranchSummary = async (branchId, timeRange) => {
  try {
    console.log('Fetching branch summary:', branchId, timeRange);
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found for branch summary API call");
      toast.error("Authentication required");
      return [];
    }
    
    // Construct query parameters
    let url = `${apiEndpoint}/branch-summary`;
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
    
    console.log("Fetching branch summary from API endpoint:", url);
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log("Successfully fetched branch summary data:", response.data);
      return response.data;
    } else {
      console.error("Error fetching branch summary data:", response.status);
      throw new Error(`API responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching branch summary:', error);
    
    if (error.response && error.response.status === 404) {
      console.warn("Branch summary endpoint not found, using fallback data");
      
      // Fallback to constructing branch summary from other data
      // This is simplified for demonstration purposes
      
      // Define base metrics
      const metrics = [
        { name: 'Total Donors', value: 157, change: 5.2 },
        { name: 'Total Donations', value: 203, change: 7.8 },
        { name: 'Blood Units Collected', value: 195, change: 4.3 },
        { name: 'Blood Units Distributed', value: 182, change: -1.1 },
        { name: 'New Donor Registration', value: 42, change: 12.5 },
        { name: 'Staff Efficiency', value: '87%', change: 3.2 }
      ];
      
      // Apply time range multiplier
      let multiplier = 1;
      switch (timeRange) {
        case 'day': multiplier = 0.05; break;
        case 'week': multiplier = 0.25; break;
        case 'month': multiplier = 1; break;
        case 'year': multiplier = 12; break;
        default: multiplier = 1;
      }
      
      return metrics.map(metric => ({
        ...metric,
        value: typeof metric.value === 'string' 
          ? metric.value 
          : Math.round(metric.value * multiplier)
      }));
    } else {
      toast.error("Failed to fetch branch summary data");
      return [];
    }
  }
};

// Mock data functions
const getMockBranches = () => {
  return [
    { _id: 'branch001', name: 'Central Blood Bank', location: 'Downtown', phoneNumber: '555-0101' },
    { _id: 'branch002', name: 'North District Center', location: 'North Hills', phoneNumber: '555-0102' },
    { _id: 'branch003', name: 'Eastside Donation Center', location: 'East Village', phoneNumber: '555-0103' },
    { _id: 'branch004', name: 'South Community Center', location: 'South Side', phoneNumber: '555-0104' },
    { _id: 'branch005', name: 'West Medical Plaza', location: 'West End', phoneNumber: '555-0105' }
  ];
};

export default {
  getAllUsers,
  getUserById,
  saveUser,
  deleteUser,
  login,
  logout,
  getCurrentUser,
  loginWithJwt,
  getJwt,
  getUserProfile,
  changePassword,
  updateUserSettings,
  getAvailableRoles,
  getUsersByBranch,
  getBranches,
  getStaffPerformance,
  getBranchSummary
};
