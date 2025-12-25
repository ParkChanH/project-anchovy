'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile, getUserProfile, UserProfile } from '@/lib/firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOffline: boolean; // Firebase 연결 실패 시 true
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Firebase 설정 확인
const isFirebaseConfigured = () => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return apiKey && apiKey !== 'YOUR_API_KEY' && apiKey.length > 10;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // 프로필 불러오기
  const loadProfile = async (userId: string) => {
    try {
      let userProfile = await getUserProfile(userId);
      
      // 프로필이 없으면 새로 생성
      if (!userProfile) {
        await createUserProfile(userId, {});
        userProfile = await getUserProfile(userId);
      }
      
      setProfile(userProfile);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    }
  };

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  // 익명 로그인
  const signIn = async () => {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase 설정이 없습니다. 오프라인 모드로 실행합니다.');
      setIsOffline(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      setUser(result.user);
      await loadProfile(result.user.uid);
      setIsOffline(false);
    } catch (error) {
      console.error('로그인 실패:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      if (user) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 인증 상태 감지
  useEffect(() => {
    // Firebase 설정이 없으면 오프라인 모드
    if (!isFirebaseConfigured()) {
      console.warn('Firebase 설정이 없습니다. 오프라인 모드로 실행합니다.');
      console.info('README.md의 Firebase 설정 가이드를 참고하세요.');
      setIsOffline(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser.uid);
        setIsOffline(false);
        setLoading(false);
      } else {
        // 사용자가 없으면 자동으로 익명 로그인 시도
        try {
          const result = await signInAnonymously(auth);
          setUser(result.user);
          await loadProfile(result.user.uid);
          setIsOffline(false);
        } catch (error) {
          console.debug('로그인 실패:', error);
          // 익명 인증 실패 시 오프라인 모드로 전환
          setUser(null);
          setProfile(null);
          setIsOffline(true);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isOffline, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
