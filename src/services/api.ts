import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { AuthResponse, Project, User } from '../types/project';

const API: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
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
  getProfile: (): Promise<AxiosResponse<User>> => API.get('/auth/profile'),
  updateProfile: (profileData: Partial<User>): Promise<AxiosResponse<User>> =>
    API.put('/auth/profile', profileData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const projectAPI = {
  getProjects: (): Promise<AxiosResponse<Project[]>> => API.get<Project[]>('/projects'),
  getProject: (id: string): Promise<AxiosResponse<Project>> => API.get<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>): Promise<AxiosResponse<Project>> =>
    API.post<Project>('/projects', data),
  updateProject: (id: string, data: Partial<Project>): Promise<AxiosResponse<Project>> =>
    API.put<Project>(`/projects/${id}`, data)
};

export default API;