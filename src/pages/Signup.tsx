import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState<{ name: string; email: string; password: string; dateOfBirth: string }>({
    name: '',
    email: '',
    password: '',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.signup(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input name="name" type="text" placeholder="Full Name" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="mb-4">
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="mb-4">
            <input name="password" type="password" placeholder="Password (min 8 characters)" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="mb-6">
            <input name="dateOfBirth" type="date" placeholder="Date of Birth" onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-4">
          Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;