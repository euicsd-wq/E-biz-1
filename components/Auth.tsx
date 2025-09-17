import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { BuildingOfficeIcon } from './icons';

type AuthView = 'login' | 'reset_request' | 'reset_sent';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<AuthView>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for password reset instructions.');
      setView('reset_sent');
    }
    setLoading(false);
  };
  
  const renderContent = () => {
    if (view === 'reset_sent') {
      return (
        <>
          <p className="text-center text-slate-300">{message}</p>
          <p className="text-sm text-center">
            <button onClick={() => { setView('login'); setError(''); }} className="font-medium text-blue-400 hover:underline">
              Back to Sign In
            </button>
          </p>
        </>
      );
    }

    if (view === 'reset_request') {
      return (
        <>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-center text-white">Reset Password</h1>
            <p className="text-center text-slate-400 mt-2">Enter your email to receive a reset link.</p>
          </div>
          <form className="space-y-6" onSubmit={handlePasswordResetRequest}>
            <div>
              <label htmlFor="email" className="label-style">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-style" />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
           <p className="text-sm text-center">
            <button onClick={() => { setView('login'); setError(''); }} className="font-medium text-blue-400 hover:underline">
              Back to Sign In
            </button>
          </p>
        </>
      );
    }

    return (
      <>
        <div className="text-center">
            <BuildingOfficeIcon className="mx-auto w-12 h-12 text-blue-500"/>
            <h1 className="text-3xl font-bold text-center text-white mt-4">Tenders Hub</h1>
            <p className="text-center text-slate-400 mt-2">
            Sign in to your account
            </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="label-style">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-style" />
          </div>
          <div>
            <label htmlFor="password"  className="label-style">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-style" />
          </div>
          <div className="text-right">
              <button type="button" onClick={() => { setView('reset_request'); setError(''); }} className="text-sm font-medium text-blue-400 hover:underline">
                Forgot your password?
              </button>
            </div>
          <button type="submit" disabled={loading} className="w-full btn-primary">
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>
        {error && <p className="text-center text-sm text-red-400 bg-red-500/10 p-2 rounded-md">{error}</p>}
        <p className="text-sm text-center text-slate-500 pt-4 border-t border-slate-700">
          New user accounts can only be created by an administrator.
        </p>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-lg shadow-2xl shadow-blue-900/20 border border-slate-700">
        {renderContent()}
      </div>
    </div>
  );
};
export default Auth;
