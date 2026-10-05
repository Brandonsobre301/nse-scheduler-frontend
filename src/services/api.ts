import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthResponse, Project, AuthUser, EstimationRequest, EstimationResponse } from '../types/project';

// In Docker (production): defaults to '/api' — nginx proxies /api/* to backend:5000/*
// In local dev: set REACT_APP_API_URL=http://localhost:5000 in .env
const API: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized:', error.config.url);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Make a POST request to the backend API endpoint '/auth/login' with the user's credentials using axios
  login: (credentials: { email: string; password: string }): Promise<AxiosResponse<AuthResponse>> =>
    API.post<AuthResponse>('/auth/login', credentials),
  signup: (userData: { name: string; email: string; password: string; dateOfBirth: string }): Promise<AxiosResponse<unknown>> =>
    API.post('/auth/signup', userData),
  getProfile: (): Promise<AxiosResponse<AuthUser>> => API.get('/auth/profile'),
  updateProfile: (profileData: Partial<AuthUser>): Promise<AxiosResponse<AuthUser>> =>
    API.put('/auth/profile', profileData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const projectAPI = {
  getProjects: (): Promise<AxiosResponse<Project[]>> => API.get<Project[]>('/projects'),
  getProject: (id: string): Promise<AxiosResponse<Project>> => API.get<Project>(`/projects/${id}`),
  // Backend wraps the created project: { msg, project }, unlike GET/PUT which return the project directly
  createProject: (data: Partial<Project>): Promise<AxiosResponse<{ msg: string; project: Project }>> =>
    API.post<{ msg: string; project: Project }>('/projects', data),
  updateProject: (id: string, data: Partial<Project>): Promise<AxiosResponse<Project>> =>
    API.put<Project>(`/projects/${id}`, data),
  deleteProject: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    API.delete(`/projects/${id}`)
};

export const estimateAPI = {
  calculate: (body: EstimationRequest): Promise<AxiosResponse<EstimationResponse>> =>
    API.post<EstimationResponse>('/v1/estimate', body)
};

export default API;