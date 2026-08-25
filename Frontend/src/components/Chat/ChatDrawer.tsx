import { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, X } from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { listConversations } from '../../chat/api';
import type { Conversation } from '../../chat/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
  }).format(new Date(value));
}

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await listConversations({ page: 1, limit: 50 });
      setConversations(page.items);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadConversations();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600"><MessageSquare className="h-5 w-5" /></span>
            <div><h3 className="text-sm font-bold">Tin nhắn</h3><p className="text-[11px] text-slate-300">Hội thoại từ đơn đã được chấp nhận</p></div>
          </div>
          <button onClick={onClose} aria-label="Đóng danh sách tin nhắn" className="rounded-lg p-1 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
          {isLoading && <p className="py-10 text-center text-sm text-slate-500">Đang tải hội thoại…</p>}
          {!isLoading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center"><p className="text-sm text-red-700">{error}</p><button onClick={() => void loadConversations()} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm"><RefreshCw className="h-3.5 w-3.5" /> Thử lại</button></div>
          )}
          {!isLoading && !error && conversations.length === 0 && (
            <div className="py-16 text-center text-slate-500"><MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="text-sm font-medium">Chưa có hội thoại</p><p className="mt-1 text-xs">Hội thoại sẽ xuất hiện khi một đơn ứng tuyển được chấp nhận.</p></div>
          )}
          {!isLoading && !error && conversations.map((conversation) => (
            <button key={conversation.id} className="mb-2 flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{conversation.participant.name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-slate-800">{conversation.participant.name}</strong><time className="shrink-0 text-[10px] text-slate-400">{formatUpdatedAt(conversation.updatedAt)}</time></span><span className="mt-0.5 block truncate text-xs text-slate-500">{conversation.internship.title}</span><span className="mt-1 block truncate text-xs text-slate-600">{conversation.latestMessage?.content ?? 'Chưa có tin nhắn'}</span></span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
