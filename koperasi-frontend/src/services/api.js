import axios from "axios";

// =========================
// API BASE URL
// =========================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// =========================
// AXIOS INSTANCE
// =========================

const api = axios.create({
  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json"
  }
});

// =========================
// REQUEST INTERCEPTOR
// =========================
// Otomatis memasukkan JWT token
// ke setiap request setelah login.

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =========================
// RESPONSE INTERCEPTOR
// =========================
// Jika token tidak valid / expired,
// hapus session lokal.

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

// =========================
// EXPORT
// =========================

export default api;