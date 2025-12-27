'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAnon, loading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, nickname);
      } else {
        await signInWithEmail(email, password);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 실패');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '구글 로그인 실패');
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    try {
      await signInAnon();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '게스트 로그인 실패');
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 overflow-hidden relative">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-40 -left-40 w-96 h-96 bg-[#C6FF00]/10 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 그리드 패턴 */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 로고 & 타이틀 */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="text-7xl mb-6 inline-block"
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            🐟
          </motion.div>
          <h1 className="text-4xl font-black mb-3">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              멸치 탈출
            </span>
          </h1>
          <p className="text-gray-500 font-medium tracking-wide">나만의 벌크업 트레이너</p>
        </motion.div>

        {/* 로그인 카드 */}
        <motion.div 
          className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* 카드 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
          
          <div className="relative p-7">
            {/* 탭 */}
            <div className="flex mb-7 bg-white/5 rounded-2xl p-1.5">
              {['로그인', '회원가입'].map((tab, index) => (
                <motion.button
                  key={tab}
                  onClick={() => setIsSignUp(index === 1)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative ${
                    (index === 0 ? !isSignUp : isSignUp)
                      ? 'text-black' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {(index === 0 ? !isSignUp : isSignUp) && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] rounded-xl"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </motion.button>
              ))}
            </div>

            {/* 에러 메시지 */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-5"
                >
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                    ⚠️ {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 폼 */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <label className="block text-sm text-gray-400 mb-2 font-medium">닉네임</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C6FF00]/50 focus:bg-white/10 transition-all"
                      placeholder="닉네임을 입력하세요"
                      required={isSignUp}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C6FF00]/50 focus:bg-white/10 transition-all"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C6FF00]/50 focus:bg-white/10 transition-all"
                  placeholder="비밀번호를 입력하세요"
                  required
                  minLength={6}
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] text-black font-bold py-4 rounded-xl text-base shadow-lg shadow-[#C6FF00]/20 disabled:opacity-50 disabled:shadow-none"
                whileHover={{ scale: 1.01, boxShadow: "0 10px 40px rgba(198, 255, 0, 0.3)" }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span 
                      className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    처리 중...
                  </span>
                ) : (
                  isSignUp ? '회원가입' : '로그인'
                )}
              </motion.button>
            </form>

            {/* 구분선 */}
            <div className="flex items-center my-7">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <span className="px-4 text-gray-500 text-sm font-medium">또는</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {/* 소셜 로그인 */}
            <div className="space-y-3">
              <motion.button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-lg"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </motion.button>

              <motion.button
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white/5 text-gray-300 font-medium py-3.5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-xl">👤</span>
                게스트로 시작하기
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* 하단 텍스트 */}
        <motion.p 
          className="text-center text-gray-600 text-xs mt-8 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          로그인하면 서비스 이용약관에 동의하게 됩니다
        </motion.p>
      </motion.div>
    </div>
  );
}
