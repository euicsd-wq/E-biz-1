import React, { useState } from 'react';
import type { useTenderStore } from '../hooks/useTenderStore';
import type { TeamMember } from '../types';
import { supabase } from '../services/supabaseClient';

type MyProfileProps = {
  store: ReturnType<typeof useTenderStore>;
  currentUser: TeamMember;
};

const MyProfile: React.FC<MyProfileProps> = ({ store, currentUser }) => {
  const [name, setName] = useState(currentUser.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleNameUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentUser.name) {
      store.updateCurrentUserName(currentUser.id, name.trim());
    }
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPasswordError(error.message);
      store.addToast(`Error updating password: ${error.message}`, 'error');
    } else {
      store.addToast('Password updated successfully.', 'success');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
        <form onSubmit={handleNameUpdate} className="space-y-4">
          <div>
            <label className="label-style">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-style" />
          </div>
          <div>
            <label className="label-style">Email</label>
            <input type="email" value={currentUser.email} readOnly disabled className="input-style" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Save Name</button>
          </div>
        </form>
      </div>
      <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="label-style">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-style" />
          </div>
          <div>
            <label className="label-style">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-style" />
          </div>
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;
