import http from "./httpService"; // Adjust the import according to your project structure

const apiEndpoint = "/api/bloodRequest/unread"; // Adjust the endpoint according to your API

export function getUnreadBloodRequests() {
  return http.get(apiEndpoint);
}
