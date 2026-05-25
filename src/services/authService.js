// authService.js
import axios from "axios";
import jwtDecode from "jwt-decode";
import { toast } from "react-toastify";

const apiEndpoint = "http://localhost:4000/api/auth";
const tokenKey = "token";

axios.defaults.baseURL = "http://localhost:4000/api";

// Function to get JWT from local storage
export function getJwt() {
  return localStorage.getItem(tokenKey);
}

// Interceptor to include JWT in request headers
axios.interceptors.request.use(
  (config) => {
    const token = getJwt();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const expectedError =
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500;

    if (!expectedError) {
      console.error("Logging the error", error);
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

export async function login(email, password) {
  try {
    console.log("Sending login request:", { email, password });
    const { data } = await axios.post(apiEndpoint, { email, password });
    console.log("Received data:", data);

    const { token, user } = data;
    if (!token || !user) {
      throw new Error("Invalid login response format");
    }

    localStorage.setItem(tokenKey, token);
    localStorage.setItem("user", JSON.stringify(user));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Log to verify
    console.log("Stored token:", localStorage.getItem(tokenKey));
    console.log("Stored user:", localStorage.getItem("user"));
  } catch (error) {
    console.error("Login request failed:", error);
    throw error;
  }
}

export function loginWithJwt(jwt) {
  localStorage.setItem(tokenKey, jwt);
  axios.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
}

export function logout() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem("user");
  delete axios.defaults.headers.common["Authorization"];
}

export function getCurrentUser() {
  try {
    const jwt = localStorage.getItem(tokenKey);
    return jwtDecode(jwt);
  } catch (ex) {
    return null;
  }
}

export async function getCurrentUserRole() {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? user.role : null;
}

export default {
  login,
  loginWithJwt,
  logout,
  getCurrentUser,
  getCurrentUserRole,
  getJwt,
};
