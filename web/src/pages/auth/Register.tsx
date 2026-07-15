import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@elegant-code/shared';
import { useRegisterMutation } from '../../store/apiSlice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, User, Code2, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data).unwrap();
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      console.error('Greška pri registraciji:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Code2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Napravi nalog</h1>
          <p className="text-slate-400 mt-2 text-sm">Pridruži se platformi Elegant Code</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-sm text-red-400 text-center font-medium">
              {(error as any)?.data?.error || 'Došlo je do greške pri registraciji'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <Input 
              label="Ime" 
              icon={User} 
              placeholder="Unesite vaše ime" 
              {...register('firstName')}
              error={errors.firstName?.message}
            />
            <Input 
              label="Prezime" 
              icon={User} 
              placeholder="Unesite vaše prezime" 
              {...register('lastName')}
              error={errors.lastName?.message}
            />
            <Input 
              label="Email" 
              type="email" 
              icon={Mail} 
              placeholder="vas@email.com" 
              {...register('email')}
              error={errors.email?.message}
            />
            <Input 
              label="Broj telefona" 
              type="tel" 
              icon={Phone} 
              placeholder="06x xxx xxxx" 
              {...register('phoneNumber')}
              error={errors.phoneNumber?.message}
            />
            <Input 
              label="Lozinka" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              {...register('password')}
              error={errors.password?.message}
            />
          </div>
          <Button type="submit" className="w-full mt-8" isLoading={isLoading}>
            Završi registraciju
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Već imate nalog?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-primary transition-colors">
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  );
}
