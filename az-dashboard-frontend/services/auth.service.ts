// src/services/auth.service.ts
import api from '@/lib/api';

export const loginRequest = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', {
    email,
    password,
  });

  return data;
};