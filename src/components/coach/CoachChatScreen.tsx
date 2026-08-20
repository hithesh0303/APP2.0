import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Send, Bot, User, Trash2, Volume2, VolumeX, Lightbulb, RefreshCw } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const CoachChatScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your dedicated FitAI Coach. I have your metabolic stats, daily targets (${profile?.dailyCalorieTarget || 2000} kcal, ${profile?.proteinTarget || 120}g protein), and goals in context. How can I guide your fitness or nutrition today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: ChatMsg = {
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history for context
      const chatHistory = messages.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const res = await api.chatCoach(query, chatHistory);

      const assistantMsg: ChatMsg = {
        role: 'assistant',
        content: res.content || res.reply || "I'm analyzing your fitness progress. Let me know if you'd like more details.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(assistantMsg.content);
    } catch (err) {
      console.error('Chat coach error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I experienced a brief connection blip with Gemini AI. Please ask again in a moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze my current progress & weekly streak 📊',
    'Why is high protein crucial for my goal? 🥩',
    'Suggest a budget Indian vegetarian dinner 🍛',
    'How do I overcome a weight loss plateau? ⚡',
    'Best pre-workout and post-workout snacks 🍌',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-175px)] max-w-4xl mx-auto space-y-3 pb-4" id="coach-chat-screen">
      {/* Header Bar */}
      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">FitAI Personal Coach</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-neutral-500">Gemini 2.5 Flash • Context-Aware Fitness & Nutrition</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
              speechEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
            }`}
            title={speechEnabled ? 'Text-to-speech active' : 'Turn on voice readout'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                  AI
                </div>
              )}
              <div
                className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <span
                  className={`text-[9px] mt-1.5 block font-mono ${
                    isUser ? 'text-emerald-200 text-right' : 'text-neutral-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-neutral-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs">
              AI
            </div>
            <div className="p-3.5 bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-xs border border-neutral-200 dark:border-neutral-700 flex items-center space-x-2 text-xs text-neutral-500">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
              <span>FitAI is formulating tailored advice...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Chips */}
      <div className="flex overflow-x-auto py-1 gap-1.5 no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 whitespace-nowrap shrink-0 transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex space-x-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask anything about nutrition, gym form, calorie deficits, recovery..."
          className="flex-1 px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500 shadow-xs"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask Coach</span>
        </button>
      </form>
    </div>
  );
};
