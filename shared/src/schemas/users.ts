import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(2, "Ime mora imati bar 2 karaktera"),
  lastName: z.string().min(2, "Prezime mora imati bar 2 karaktera"),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Nevalidan email format"),
  password: z.string().min(6, "Lozinka mora imati bar 6 karaktera"),
  phoneNumber: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'UCENIK', 'KLIJENT', 'GOST']).default('UCENIK'),
  activePackage: z.enum(['NONE', 'OSNOVNI', 'SREDNJI', 'NAPREDNI']).default('NONE')
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2, "Ime mora imati bar 2 karaktera").optional(),
  lastName: z.string().min(2, "Prezime mora imati bar 2 karaktera").optional(),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Nevalidan email format").optional(),
  password: z.string().min(6, "Lozinka mora imati bar 6 karaktera").optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROFESOR', 'UCENIK', 'KLIJENT', 'GOST']).optional(),
  activePackage: z.enum(['NONE', 'OSNOVNI', 'SREDNJI', 'NAPREDNI']).optional()
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  activePackage: string;
  progress?: {
    currentLevel: number;
    totalClassesAttended: number;
    xp: number;
  };
  lastLoginAt?: Date;
  membershipExpiresAt?: Date;
  createdAt: Date;
}

export interface GetUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    totalPages: number;
    totalUsers: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  activePackage?: string;
}
