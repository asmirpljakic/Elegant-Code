import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Nevalidna email adresa'),
  password: z.string().min(6, 'Lozinka mora imati barem 6 karaktera')
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Ime mora imati bar 2 karaktera'),
  lastName: z.string().min(2, 'Prezime mora imati bar 2 karaktera'),
  email: z.string().email('Neispravna email adresa'),
  password: z.string().min(6, 'Lozinka mora imati bar 6 karaktera'),
  phoneNumber: z.string().min(6, 'Broj telefona mora imati bar 6 karaktera').max(20, 'Broj telefona je predugačak'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
