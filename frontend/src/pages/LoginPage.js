import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_autovista-search/artifacts/9soiiv3t_ChatGPT%20Image%20Apr%2017%2C%202026%2C%2007_36_31%20PM.png";
const BG_URL = "https://static.prod-images.emergentagent.com/jobs/014d81ed-6d1e-486e-931c-c64e7d22d8e8/images/1e86ca222d893c57534c15c2e03ffdcabb19f382f95705f83a3ff28b207d5ac6.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  return (
    <motion.div className="dark-page min-h-screen flex items-center justify-center px-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="fixed inset-0 z-0">
        <img src={BG_URL} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070D]/80 to-[#05070D]" />
      </div>

      <motion.div className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-black/50 border border-white/15 rounded-3xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>

        <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white" onClick={() => navigate('/')} data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <motion.img src={LOGO_URL} alt="AutoVista" className="h-10 mb-6 object-contain"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} />

        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Welcome Back</h1>
        <p className="text-gray-400 mb-8 text-sm">Login to continue your car discovery journey</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} data-testid="error-message">
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              required data-testid="email-input" placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
            <div className="relative">
              <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 pr-10 transition-all"
                required data-testid="password-input" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" disabled={loading} data-testid="login-button"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-5 text-base hover:shadow-[0_0_24px_rgba(6,182,212,0.4)] transition-all">
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'Login'}
            </Button>
          </motion.div>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium" data-testid="register-link">Register here</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
