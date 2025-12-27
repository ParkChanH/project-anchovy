'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getInitialGreeting, getQuickReplies, ChatMessage } from '@/lib/ai/deepseek';
import { getMonthlyLogs } from '@/lib/firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AITrainerChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AITrainerChat({ isOpen, onClose }: AITrainerChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 초기화
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getInitialGreeting(profile);
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
      setQuickReplies(getQuickReplies('greeting'));
    }
  }, [isOpen, profile, messages.length]);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setQuickReplies([]);

    try {
      // 최근 로그 가져오기
      let recentLogs: Awaited<ReturnType<typeof getMonthlyLogs>> = [];
      if (user) {
        try {
          const now = new Date();
          recentLogs = await getMonthlyLogs(user.uid, now.getFullYear(), now.getMonth() + 1);
        } catch (e) {
          console.error('로그 가져오기 실패:', e);
        }
      }

      // API 호출을 위한 메시지 형식 변환
      const chatHistory: ChatMessage[] = messages
        .filter(m => m.id !== 'greeting')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));
      chatHistory.push({ role: 'user', content: content.trim() });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          profile,
          recentLogs: recentLogs.slice(0, 7),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // 컨텍스트에 따른 빠른 응답 제안
        if (content.includes('운동') || content.includes('웨이트')) {
          setQuickReplies(getQuickReplies('workout'));
        } else if (content.includes('식단') || content.includes('먹') || content.includes('음식')) {
          setQuickReplies(getQuickReplies('diet'));
        } else {
          setQuickReplies(getQuickReplies('general'));
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `죄송해요, 오류가 발생했어요. 😅\n\n${data.error || '잠시 후 다시 시도해주세요.'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요. 😢',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg h-[85vh] sm:h-[600px] bg-gradient-to-b from-[#1a1a2e] to-[#0f0f23] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden border border-white/10"
          onClick={e => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#C6FF00]/10 to-transparent">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C6FF00] to-[#9EF01A] flex items-center justify-center shadow-lg shadow-[#C6FF00]/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">🤖</span>
              </motion.div>
              <div>
                <h2 className="text-white font-bold text-lg">AI 트레이너</h2>
                <p className="text-[#C6FF00] text-xs flex items-center gap-1">
                  <motion.span 
                    className="w-2 h-2 bg-[#C6FF00] rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  온라인
                </p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] text-black'
                      : 'bg-white/10 text-white border border-white/10'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-black/50' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* 로딩 인디케이터 */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 bg-[#C6FF00] rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 빠른 응답 */}
          {quickReplies.length > 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-2"
            >
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickReplies.map((reply, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-[#C6FF00]/10 hover:border-[#C6FF00]/30 hover:text-[#C6FF00] transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {reply}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 입력 영역 */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C6FF00]/50 focus:bg-white/15 transition-all disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#C6FF00] to-[#9EF01A] flex items-center justify-center text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C6FF00]/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    ⏳
                  </motion.span>
                ) : (
                  <span className="text-xl">→</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

