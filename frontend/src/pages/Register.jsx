import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send data to our backend API
      await axios.post('https://spendwise-backend-sdmo.onrender.com/api/auth/register', {
        name,
        email,
        password
      });
      // If successful, automatically send them to the login page
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Create Account</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input 
              type="text" required
              className="mt-1 block w-full p-2 border border-slate-300 rounded focus:outline-blue-500"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input 
              type="email" required
              className="mt-1 block w-full p-2 border border-slate-300 rounded focus:outline-blue-500"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" required
              className="mt-1 block w-full p-2 border border-slate-300 rounded focus:outline-blue-500"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium">
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}