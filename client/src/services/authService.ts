import apiClient from './apiClient';
import { LoginRequest, LoginResponse, RegisterRequest, ApiResponse } from '@shared/types';

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/login', data);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>('/register', data);
  return response.data;
};

export const logout = async (): Promise<ApiResponse> => {
  const response = await apiClient.post<ApiResponse>('/logout');
  return response.data;
};

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await apiClient.post('/verify-token', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.success;
  } catch (error) {
    return false;
  }
};

export const refreshToken = async (refreshToken: string): Promise<{ token: string }> => {
  const response = await apiClient.post('/refresh', { refreshToken });
  return response.data;
};
