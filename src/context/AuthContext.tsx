'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile, getUserProfile, UserProfile, updateUserProfile } from '@/lib/firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  signInAnon: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, nickname: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const loadProfile = async (firebaseUser: User) => {
    try {
      let userProfile = await getUserProfile(firebaseUser.uid);
      
      // 프로필이 없으면 새로 생성
      if (!userProfile) {
        await createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email || undefined,
          nickname: firebaseUser.displayName || undefined,
          photoUrl: firebaseUser.photoURL || undefined,
        });
        userProfile = await getUserProfile(firebaseUser.uid);
      }
      
      setProfile(userProfile);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    }
  };

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  // 익명 로그인
  const signInAnon = async () => {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase 설정이 없습니다.');
      setIsOffline(true);
      return;
    }

    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      setUser(result.user);
      await loadProfile(result.user);
      setIsOffline(false);
    } catch (error) {
      console.error('익명 로그인 실패:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 로그인
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      await loadProfile(result.user);
      setIsOffline(false);
    } catch (error: unknown) {
      console.error('이메일 로그인 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '로그인 실패';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 회원가입
  const signUpWithEmail = async (email: string, password: string, nickname: string) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      await updateProfile(result.user, { displayName: nickname });
      
      // Firestore 프로필 생성
      await createUserProfile(result.user.uid, {
        email,
        nickname,
      });
      
      setUser(result.user);
      await loadProfile(result.user);
      setIsOffline(false);
    } catch (error: unknown) {
      console.error('회원가입 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '회원가입 실패';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 구글 로그인
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 기존 프로필 확인
      let userProfile = await getUserProfile(result.user.uid);
      
      if (!userProfile) {
        // 새 사용자면 프로필 생성
        await createUserProfile(result.user.uid, {
          email: result.user.email || undefined,
          nickname: result.user.displayName || undefined,
          photoUrl: result.user.photoURL || undefined,
        });
      } else {
        // 기존 사용자면 이메일/사진 업데이트
        await updateUserProfile(result.user.uid, {
          email: result.user.email || undefined,
          photoUrl: result.user.photoURL || undefined,
        });
      }
      
      setUser(result.user);
      await loadProfile(result.user);
      setIsOffline(false);
    } catch (error: unknown) {
      console.error('구글 로그인 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '구글 로그인 실패';
      throw new Error(errorMessage);
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
    if (!isFirebaseConfigured()) {
      console.warn('Firebase 설정이 없습니다. 오프라인 모드로 실행합니다.');
      setIsOffline(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadProfile(firebaseUser);
        setIsOffline(false);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isOffline, 
      signInAnon,
      signInWithEmail, 
      signUpWithEmail,
      signInWithGoogle,
      signOut, 
      refreshProfile 
    }}>
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
