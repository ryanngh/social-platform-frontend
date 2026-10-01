import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import type { InCallChatMessage } from '../../types/call';

interface InCallChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: InCallChatMessage[];
  onSendMessage: (text: string) => void;
  partnerName: string;
}

export const InCallChatDrawer: React.FC<InCallChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  partnerName,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[320px] bg-[#121216]/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl animate-fadeIn">
      {/* Drawer Header */}
      <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white tracking-wide">Trò chuyện trong cuộc gọi</h3>
          <p className="text-[10px] text-gray-400">với {partnerName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="Đóng chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 text-gray-400">
            <p className="text-xs">Chưa có tin nhắn nào trong cuộc gọi</p>
            <p className="text-[10px] text-gray-500 mt-1">
              Gửi tin nhắn hoặc liên kết nhanh mà không làm gián đoạn cuộc trò chuyện.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] text-gray-400 font-medium">
                  {msg.isMine ? 'Bạn' : msg.senderName}
                </span>
                <span className="text-[9px] text-gray-500">{msg.timestamp}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                  msg.isMine
                    ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-br-xs'
                    : 'bg-white/10 text-gray-100 rounded-bl-xs border border-white/5'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-white/10 border border-white/10 rounded-full px-3.5 py-2 text-xs text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-[#0095F6] transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-[#004AC6] hover:bg-[#003ba0] disabled:opacity-40 text-white rounded-full transition cursor-pointer shrink-0 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default InCallChatDrawer;
