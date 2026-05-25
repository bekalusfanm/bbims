import http from "./httpService";
import { apiUrl } from "../config.json";

export function getBloodTypes() {
  return http.get(`${apiUrl}/bloodType`);
}
