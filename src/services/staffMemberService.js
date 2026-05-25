import axios from "axios";
import { toast } from "react-toastify";
import { apiUrl } from "../config.json";

const apiEndpoint = `${apiUrl}/staff`;

// Helper function to format staff member data
const formatStaffMemberData = (staffMember) => {
  return {
    firstName: staffMember.firstName,
    lastName: staffMember.lastName,
    email: staffMember.email,
    phone: staffMember.phone,
    role: staffMember.role,
    branchId: staffMember.branchId,
    address: staffMember.address,
    dateOfBirth: staffMember.dateOfBirth,
    hireDate: staffMember.hireDate,
    photo: staffMember.photo
  };
};

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return token;
};

export const getStaffMembers = async () => {
  try {
    const token = getAuthToken();
    const response = await axios.get(apiEndpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching staff members:", error);
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      // You might want to redirect to login here
    } else {
      toast.error("Failed to fetch staff members");
    }
    throw error;
  }
};

export const getStaffMember = async (id) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${apiEndpoint}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching staff member:", error);
    if (error.response?.status === 404) {
      toast.error("Staff member not found");
    } else {
      toast.error("Failed to fetch staff member details");
    }
    throw error;
  }
};

export const saveStaffMember = async (staffMember) => {
  try {
    const token = getAuthToken();
    const formattedData = formatStaffMemberData(staffMember);

    console.log("Attempting to save staff member...");
    console.log("API Endpoint:", apiEndpoint);
    console.log("Formatted Request Data:", formattedData);

    const response = await axios.post(apiEndpoint, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    toast.success("Staff member saved successfully");
    return response.data;
  } catch (error) {
    console.error("Error saving staff member:", error);
    if (error.response) {
      const errorMessage = error.response.data.message || "Failed to save staff member";
      toast.error(errorMessage);
      // Return the error response for form validation
      return { error: error.response.data };
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error("Failed to save staff member. Please try again.");
    }
    throw error;
  }
};

export const updateStaffMember = async (id, staffMember) => {
  try {
    const token = getAuthToken();
    const formattedData = formatStaffMemberData(staffMember);

    const response = await axios.put(`${apiEndpoint}/${id}`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    toast.success("Staff member updated successfully");
    return response.data;
  } catch (error) {
    console.error("Error updating staff member:", error);
    if (error.response) {
      const errorMessage = error.response.data.message || "Failed to update staff member";
      toast.error(errorMessage);
      // Return the error response for form validation
      return { error: error.response.data };
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error("Failed to update staff member");
    }
    throw error;
  }
};

export const deleteStaffMember = async (id) => {
  try {
    const token = getAuthToken();
    await axios.delete(`${apiEndpoint}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Staff member deleted successfully");
  } catch (error) {
    console.error("Error deleting staff member:", error);
    if (error.response?.status === 404) {
      toast.error("Staff member not found");
    } else {
      toast.error("Failed to delete staff member");
    }
    throw error;
  }
};

export const getStaffMembersByBranch = async (branchId) => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${apiEndpoint}/branch/${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching staff members by branch:", error);
    if (error.response?.status === 404) {
      toast.error("Branch not found");
    } else {
      toast.error("Failed to fetch staff members for branch");
    }
    throw error;
  }
};

export const uploadStaffPhoto = async (file) => {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("photo", file);

    const response = await axios.post(`${apiEndpoint}/upload-photo`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.photoUrl;
  } catch (error) {
    console.error("Error uploading staff photo:", error);
    if (error.response?.status === 413) {
      toast.error("File size too large. Please upload a smaller image.");
    } else if (error.response?.status === 415) {
      toast.error("Invalid file type. Please upload an image file.");
    } else {
      toast.error("Failed to upload staff photo");
    }
    throw error;
  }
}; 