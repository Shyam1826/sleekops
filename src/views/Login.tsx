import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

interface LoginProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  
  const handleSuccess = async (credentialResponse: any) => {
    // 🔑 The component automatically returns a clean, secure idToken string here
    const idToken = credentialResponse.credential;
    if (!idToken) return;

    try {
      console.log('[Auth Hook] Google authorization verified locally. Handshaking with backend...');
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001' ;

      // Pass the secure token directly to your express service
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/google`, {
        idToken: idToken
      });

      if (data.success) {
        onAuthSuccess(data.token, data.user);
      }
    } catch (err) {
      console.error('[Auth Hook] Backend token exchange failed:', err);
      alert('Authentication server handshake timed out. Check backend logs.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090A0F] relative overflow-hidden">
      {/* Absolute Ambient Cyber Glow Backdrop Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Panel Container */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#141722]/80 backdrop-blur-xl border border-white/5 shadow-2xl z-10 text-center transition-all duration-300 hover:border-sky-500/20">
        
        {/* SleekOps Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 mb-4 shadow-lg shadow-sky-500/20">
            <span className="text-white font-bold text-xl tracking-wider">S</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Welcome to SleekOps</h1>
          <p className="text-sm text-gray-400">Autonomous Logistics Infrastructure Matrix</p>
        </div>

        {/* Action Call Boundary */}
        <div className="flex justify-center items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-150">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('[Auth Hook] Google Login Interrupted')}
            theme="filled_dark"
            shape="rectangular"
            size="large"
          />
        </div>

        {/* Footer Identity Note */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">SECURE PASS-THRU ENDPOINT v2.4.1</p>
        </div>

      </div>
    </div>
  );
};