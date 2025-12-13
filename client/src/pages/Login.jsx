import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';

const QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
    { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    const result = await login(credential);
    if (result.success) {
      navigate('/');
    } else {
        alert('Login Failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Inspirational/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-0" />
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black" />
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                <img src="/logo.png" alt="Forge" className="w-8 h-8 rounded-md object-contain bg-white" />
                Forge
            </div>
        </div>

        <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight mb-4">
                "{quote.text}"
            </h2>
            <p className="text-xl text-gray-400">— {quote.author}</p>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
            © {new Date().getFullYear()} Forge. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <img src="/logo.png" alt="Forge" className="lg:hidden w-16 h-16 mx-auto mb-4 object-contain" />
                <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                <p className="mt-2 text-gray-600">Please sign in to your account</p>
            </div>

            <div className="mt-8 space-y-6">
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        width="300"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
