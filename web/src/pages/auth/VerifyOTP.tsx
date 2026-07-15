import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../store/apiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    
    let focusIndex = 0;
    pastedData.forEach((char, index) => {
      if (!isNaN(Number(char)) && index < 6) {
        newOtp[index] = char;
        focusIndex = index;
      }
    });
    
    setOtp(newOtp);
    if (focusIndex < 5) {
      inputRefs.current[focusIndex + 1]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const verifyAndLogin = async (codeToVerify: string) => {
    setErrorMsg('');
    try {
      const response = await verifyOtp({ email: email!, otpCode: codeToVerify }).unwrap();
      setIsSuccess(true);
      dispatch(setCredentials({ token: response.token }));
      // Dajemo kratku pauzu da korisnik vidi zelene kvadratice
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.data?.error || 'Neispravan kod. Pokušajte ponovo.');
    }
  };

  useEffect(() => {
    const code = otp.join('');
    if (code.length === 6 && !isLoading && !isSuccess) {
      verifyAndLogin(code);
    }
  }, [otp]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Molimo vas da unesete svih 6 cifara.');
      return;
    }
    verifyAndLogin(code);
  };

  const handleResend = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await resendOtp({ email: email! }).unwrap();
      setSuccessMsg('Novi kod je uspešno poslat na vaš email.');
    } catch (err: any) {
      setErrorMsg(err.data?.error || 'Greška pri slanju novog koda.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Dekorativni elementi */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Potvrdi Email</h1>
          <p className="text-slate-400 mt-3 text-sm text-center">
            Poslali smo 6-cifreni kod na: <br/>
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl relative z-10">
            <p className="text-sm text-red-400 text-center font-medium">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/50 rounded-xl relative z-10">
            <p className="text-sm text-primary text-center font-medium">{successMsg}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6 relative z-10">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-12 h-14 bg-slate-800 border rounded-xl text-center text-2xl font-bold outline-none transition-all ${
                  isSuccess 
                    ? 'border-green-500 text-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                    : 'border-slate-700 text-white focus:ring-2 focus:ring-primary focus:border-primary'
                }`}
              />
            ))}
          </div>

          <Button type="submit" className="w-full mt-8 h-12 text-lg" isLoading={isLoading}>
            Verifikuj Nalog <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        <div className="mt-8 text-center space-y-4 relative z-10">
          <p className="text-sm text-slate-400">
            Niste dobili kod?{' '}
            <button 
              onClick={handleResend}
              disabled={isResending}
              className="text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
            >
              {isResending ? 'Šaljem...' : 'Pošalji ponovo'}
            </button>
          </p>
          
          <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Nazad na prijavu
          </Link>
        </div>
      </div>
    </div>
  );
}
