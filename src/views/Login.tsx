import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

interface LoginProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  
  // 🔐 Secure single-click auth trigger hook passed down via the GoogleAuthProvider context wrapper
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('[Auth Hook] Google authorization verified locally. Handshaking with backend...');
        
        // Pass the secure access token payload across to your live Express BFF gateway
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          accessToken: tokenResponse.access_token
        });

        if (data.success) {
          onAuthSuccess(data.token, data.user);
        }
      } catch (err) {
        console.error('[Auth Hook] Backend token exchange failed:', err);
        alert('Authentication server handshake timed out. Check backend logs.');
      }
    },
    onError: (error) => console.error('[Auth Hook] Google Login Window Interrupted:', error)
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090A0F] relative overflow-hidden">
      {/* Absolute Ambient Cyber Glow Backdrop Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Panel Container */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#141722]/80 backdrop-blur-xl border border-white/5 shadow-2xl z-10 transition-all duration-300 hover:border-sky-500/20">
        
        {/* SleekOps Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 mb-4 shadow-lg shadow-sky-500/20">
            <span className="text-white font-bold text-xl tracking-wider">S</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Welcome to SleekOps</h1>
          <p className="text-sm text-gray-400">Autonomous Logistics Infrastructure Matrix</p>
        </div>

        {/* Action Call Boundary */}
        <div className="space-y-4">
          <button
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.98 1 12 1 7.24 1 3.21 3.74 1.24 7.74l3.97 3.08C6.15 7.6 8.85 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.48-5.02 3.48-8.64z"/>
              <path fill="#FBBC05" d="M5.21 14.66c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.24 6.96C.44 8.56 0 10.36 0 12.24s.44 3.68 1.24 5.28l3.97-3.08z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.05.7-2.4.12-3.8.12-3.15 0-5.85-2.56-6.79-5.78L1.24 14.5C3.21 19.5 7.24 23 12 23z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer Identity Note */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">SECURE PASS-THRU ENDPOINT v2.4.1</p>
        </div>

      </div>
    </div>
  );
};