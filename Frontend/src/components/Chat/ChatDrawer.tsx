import React, { useState } from 'react';
import { ChatMessage, UserRole } from '../../types';
import { MessageSquare, Send, X, Bot, User, CheckCheck } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId: string;
  currentRole: UserRole;
  onSendMessage: (receiverId: string, content: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  currentUserId,
  currentRole,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  // Partner ID depending on who is logged in
  const targetReceiverId = currentRole === 'STUDENT' ? 'usr-cmp-1' : 'usr-std-1';
  const partnerName = currentRole === 'STUDENT' ? 'FPT Software HR' : 'Phạm Hoàng Sơn (Sinh viên)';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(targetReceiverId, inputText.trim());
    setInputText('');
  };

  const quickReplies = [
    'Chào anh/chị, em xin hỏi thêm về thời gian làm việc ạ?',
    'Dạ em đã cập nhật báo cáo tuần 3 trên hệ thống rồi ạ.',
    'Cảm ơn anh/chị đã phản hồi đơn ứng tuyển của em!',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {partnerName.charAt(0)}
              </div>
              <span className="w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full absolute bottom-0 right-0"></span>
            </div>
            <div>
              <h3 className="text-sm font-bold">{partnerName}</h3>
              <span className="text-[10px] text-emerald-400 font-medium">Trực tuyến (Socket.IO Connected)</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          <div className="text-center my-2">
            <span className="text-[10px] text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-full font-medium">
              Kênh trao đổi bảo mật - Mã hóa thời gian thực
            </span>
          </div>

          {messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{m.content}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                  <span>{m.timestamp}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Replies */}
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(targetReceiverId, reply)}
              className="text-[11px] bg-white border border-slate-200 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs hover:bg-blue-50 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-semibold flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
