import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Safely grab the values directly from the DOM using the "name" attributes
    const emailInput = e.target.email.value;
    const passwordInput = e.target.password.value;

    try {
      const response = await axios.post('https://spendwise-backend-sdmo.onrender.com/api/auth/login', {
        email: emailInput,
        password: passwordInput
      });
      
      const userToken = response.data.token || response.data.accessToken || response.data.jwt;
      
      if (userToken) {
        localStorage.setItem('token', userToken);
        navigate('/dashboard'); // Changed from '/' to '/dashboard'
      } else {
        setError("Login succeeded, but no token was found.");
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans text-slate-200">
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8 w-full max-w-md">
        
        <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-tight">SpendWise Login</h2>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}> 
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input 
              type="email" 
              name="email" // Added name attribute
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              name="password" // Added name attribute
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors mb-4 shadow-lg shadow-emerald-900/20"
          >
            Log In
          </button>
        </form>
        
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}