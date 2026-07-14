import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@elegant-code/shared';
import { useLoginMutation } from '../../store/apiSlice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Code2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data).unwrap();
      // Čuvanje tokena u Redux-u (koji ga automatski stavlja u localStorage)
      dispatch(setCredentials({ token: response.token }));
      // Preusmeravanje na dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Greška pri prijavi:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Code2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dobrodošli nazad</h1>
          <p className="text-slate-400 mt-2 text-sm">Unesite vaše podatke za prijavu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-sm text-red-400 text-center font-medium">
              {(error as any)?.data?.error || 'Došlo je do greške pri prijavi'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email adresa"
            type="email"
            placeholder="ime@primer.com"
            error={errors.email?.message}
            {...register('email')}
          />
          
          <Input
            label="Lozinka"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end mt-2">
            <a href="#" className="text-sm font-medium text-primary hover:text-emerald-400 transition-colors">
              Zaboravili ste lozinku?
            </a>
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            Prijavi se
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Nemate nalog?{' '}
          <Link to="/register" className="font-semibold text-white hover:text-primary transition-colors">
            Registrujte se besplatno
          </Link>
        </p>
      </div>
    </div>
  );
}
