import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'https://equalsplite-backend.onrender.com/api').replace(/\/$/, '');
export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
