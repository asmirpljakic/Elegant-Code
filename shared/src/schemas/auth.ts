import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Nevalidna email adresa'),
  password: z.string().min(6, 'Lozinka mora imati barem 6 karaktera')
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Ime mora imati barem 2 karaktera'),
  lastName: z.string().min(2, 'Prezime mora imati barem 2 karaktera'),
  email: z.string().email('Nevalidna email adresa'),
  password: z.string().min(6, 'Lozinka mora imati barem 6 karaktera')
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
