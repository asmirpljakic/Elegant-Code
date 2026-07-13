import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { LoginFormData, RegisterFormData } from '@elegant-code/shared';

// Definišemo osnovni API interfejs koristeći RTK Query
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api',
    prepareHeaders: (headers) => {
      // Ovde bismo dohvataili token iz localStorage-a i lepili ga na svaki request
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'ClassSession'],
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string; user: any }, LoginFormData>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<{ token: string; user: any }, RegisterFormData>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = apiSlice;
