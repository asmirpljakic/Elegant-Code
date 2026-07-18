import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { LoginFormData, RegisterFormData, UserResponse, UpdateUserFormData, GetUsersResponse, GetUsersParams } from '@elegant-code/shared';
import { logout } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
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

  if (result.error && result.error.status === 401) {
    const errorData = result.error.data as any;
    if (errorData?.error === 'NalogObrisan') {
      api.dispatch(logout());
      alert('Vaš nalog više ne postoji u sistemu. Bićete izlogovani.');
    }
  }
  
  return result;
};

// Definišemo osnovni API interfejs koristeći RTK Query
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Users', 'ClassSession', 'Settings', 'Notifications', 'Certificates', 'Analytics'],
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string; user: any }, LoginFormData>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<any, Partial<any>>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    verifyOtp: builder.mutation<any, { email: string, otpCode: string }>({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),
    resendOtp: builder.mutation<any, { email: string }>({
      query: (data) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body: data,
      }),
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
    getPublicProfessors: builder.query<any[], void>({
      query: () => '/users/professors/public',
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
    verifyUserManually: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}/verify`,
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
    scheduleMakeupClass: builder.mutation<void, any>({
      query: (data) => ({
        url: '/schedule/makeup',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSession', 'User', 'Users'],
    }),
    getProfessorBusySlots: builder.query<any[], string>({
      query: (profesorId) => `/schedule/public/${profesorId}`,
    }),
    scheduleTrialClass: builder.mutation<void, any>({
      query: (data) => ({
        url: '/schedule/trial',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClassSession', 'User', 'Users', 'Notifications'],
    }),
    updateClass: builder.mutation<void, { id: string, data: any, all?: boolean }>({
      query: ({ id, data, all }) => ({
        url: `/schedule/${id}${all ? '?all=true' : ''}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClassSession', 'Analytics'],
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
      invalidatesTags: ['ClassSession', 'User', 'Users', 'Analytics'], // Update korisnika zbog XP poena i Analitike
    }),
    cancelClass: builder.mutation<void, { id: string, reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/schedule/${id}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['ClassSession', 'User', 'Users'],
    }),
    getAnalytics: builder.query<any, void>({
      query: () => '/analytics',
      providesTags: ['ClassSession', 'Users', 'Analytics'],
    }),
    getNotifications: builder.query<{ notifications: any[], total: number }, { limit?: number } | void>({
      query: (params) => ({
        url: '/notifications',
        params: params || {},
      }),
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
    broadcastNotification: builder.mutation<{ message: string }, { title: string; message: string; target: 'SVI' | 'PROFESORI' | 'UCENICI' }>({
      query: (data) => ({
        url: '/notifications/broadcast',
        method: 'POST',
        body: data,
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
    getMyCertificates: builder.query<any, void>({
      query: () => '/certificates/my',
      providesTags: ['Certificates'],
    }),
    getStudentCertificates: builder.query<any, string>({
      query: (studentId) => `/certificates/${studentId}`,
      providesTags: ['Certificates'],
    }),
    approveCertificate: builder.mutation<any, { studentId: string; courseName: string }>({
      query: (data) => ({
        url: '/certificates/approve',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Certificates'],
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
  useVerifyUserManuallyMutation,
  useGetScheduleQuery,
  useGetProfessorBusySlotsQuery,
  useCreateClassMutation,
  useScheduleTrialClassMutation,
  useCompleteClassMutation,
  useCancelClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useDeleteCompletedClassesMutation,
  useGetAnalyticsQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useBroadcastNotificationMutation,
  useGetMeQuery,
  useGetMyCertificatesQuery,
  useGetStudentCertificatesQuery,
  useApproveCertificateMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useScheduleMakeupClassMutation,
  useGetPublicProfessorsQuery
} = apiSlice;
