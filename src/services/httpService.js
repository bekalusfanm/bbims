import axios from "axios";
import { toast } from "react-toastify";
import { apiUrl } from "../config.json";

// Set up the base URL for axios
axios.defaults.baseURL = apiUrl;

// Add a request interceptor to log outgoing requests
axios.interceptors.request.use(
  request => {
    console.log('API Request:', { 
      url: request.url,
      method: request.method,
      data: request.data
    });
    const token = localStorage.getItem("token");
    if (token) {
      request.headers["x-auth-token"] = token;
    }
    return request;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging and error handling
axios.interceptors.response.use(
  response => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    const expectedError =
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500;

    // Log detailed error information
    console.error('API Error:', {
      url: error.config && error.config.url,
      method: error.config && error.config.method,
      status: error.response && error.response.status,
      statusText: error.response && error.response.statusText,
      data: error.response && error.response.data,
      message: error.message
    });

    if (!expectedError) {
      // For unexpected errors (typically server issues)
      toast.error("An unexpected error occurred.");
    } else {
      // For expected errors (typically client-side issues)
      const errorMessage = (error.response && error.response.data && error.response.data.message) || "Operation failed";
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Add authorization header if token exists
export function setJwt(jwt) {
  axios.defaults.headers.common["x-auth-token"] = jwt;
}

export default {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete,
  setJwt
};
