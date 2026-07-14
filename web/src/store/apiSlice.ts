import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { LoginFormData, RegisterFormData, UserResponse, UpdateUserFormData, GetUsersResponse, GetUsersParams } from '@elegant-code/shared';
import { logout } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5001/api',
  prepareHeaders: (headers) => {
    // Ovde bismo dohvataili token iz localStorage-a i lepili ga na svaki request
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 403) {
    const errorData = result.error.data as any;
    if (errorData?.error === 'NalogDeaktiviran') {
      api.dispatch(logout());
      alert('Vaš nalog je deaktiviran. Odjavljujemo vas sa sistema.');
    }
  }
  
  return result;
};

// Definišemo osnovni API interfejs koristeći RTK Query
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Users', 'ClassSession', 'Settings', 'Notifications'],
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
    getUsers: builder.query<GetUsersResponse, GetUsersParams | void>({
      query: (params) => {
        if (!params) return '/users';
        const queryStr = new URLSearchParams();
        if (params.page) queryStr.append('page', params.page.toString());
        if (params.limit) queryStr.append('limit', params.limit.toString());
        if (params.search) queryStr.append('search', params.search);
        if (params.role) queryStr.append('role', params.role);
        if (params.activePackage) queryStr.append('activePackage', params.activePackage);
        return `/users?${queryStr.toString()}`;
      },
      providesTags: ['Users'],
    }),
    updateUser: builder.mutation<UserResponse, { id: string; data: UpdateUserFormData }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users', 'User'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
    toggleUserStatus: builder.mutation<{ message: string; isActive: boolean }, string>({
      query: (id) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Users', 'User'],
    }),
    createUser: builder.mutation<UserResponse, any>({
      query: (data) => ({
        url: `/users`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    getMe: builder.query<any, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    getSchedule: builder.query<any[], void>({
      query: () => '/schedule',
      providesTags: ['ClassSession'],
    }),
    createClass: builder.mutation<void, any>({
      query: (data) => ({
        url: '/schedule',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSession'],
    }),
    updateClass: builder.mutation<void, { id: string, data: any, all?: boolean }>({
      query: ({ id, data, all }) => ({
        url: `/schedule/${id}${all ? '?all=true' : ''}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClassSession'],
    }),
    deleteClass: builder.mutation<void, { id: string, all?: boolean }>({
      query: ({ id, all }) => ({
        url: `/schedule/${id}${all ? '?all=true' : ''}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClassSession', 'User', 'Users'],
    }),
    deleteCompletedClasses: builder.mutation<void, void>({
      query: () => ({
        url: `/schedule/completed`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClassSession', 'User', 'Users'],
    }),
    completeClass: builder.mutation<void, { id: string, presentStudentIds: string[] }>({
      query: ({ id, presentStudentIds }) => ({
        url: `/schedule/${id}/complete`,
        method: 'PUT',
        body: { presentStudentIds },
      }),
      invalidatesTags: ['ClassSession', 'User', 'Users'], // Update korisnika zbog XP poena
    }),
    getAnalytics: builder.query<any, void>({
      query: () => '/analytics',
      providesTags: ['ClassSession', 'Users'],
    }),
    getNotifications: builder.query<any[], void>({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsAsRead: builder.mutation<void, void>({
      query: () => ({
        url: `/notifications/read-all`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    getSettings: builder.query<any, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<any, any>({
      query: (data) => ({
        url: '/settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings', 'ClassSession', 'Users'], // Invalida i druge stvari jer menja analytics
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation,
  useGetUsersQuery,
  useUpdateUserMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useGetScheduleQuery,
  useCreateClassMutation,
  useCompleteClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useDeleteCompletedClassesMutation,
  useGetAnalyticsQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetMeQuery
} = apiSlice;
