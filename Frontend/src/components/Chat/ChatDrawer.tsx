import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquare, RefreshCw, Send, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getApiErrorMessage } from '../../auth/api';
import { listConversations, listMessages, markConversationMessagesRead, sendMessage } from '../../chat/api';
import type { ChatMessage, Conversation } from '../../chat/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  latestMessage: ChatMessage | null;
  onMessagesRead: () => Promise<void>;
}

const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(value));

export function ChatDrawer({ isOpen, onClose, latestMessage, onMessagesRead }: ChatDrawerProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setIsLoading(true); setError(null);
    try { setConversations((await listConversations({ page: 1, limit: 50 })).items); }
    catch (loadError) { setError(getApiErrorMessage(loadError)); }
    finally { setIsLoading(false); }
  };

  const openConversation = async (conversation: Conversation) => {
    setSelected(conversation); setIsLoading(true); setError(null);
    try {
      const page = await listMessages(conversation.id, { page: 1, limit: 100 });
      setMessages(page.items);
      await markConversationMessagesRead(conversation.id);
      await onMessagesRead();
    } catch (loadError) { setError(getApiErrorMessage(loadError)); }
    finally { setIsLoading(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !input.trim() || isSending) return;
    setIsSending(true);
    try {
      const created = await sendMessage(selected.id, input.trim());
      setMessages((items) => items.some((item) => item.id === created.id) ? items : [...items, created]);
      setInput('');
      setConversations((items) => [
        { ...selected, latestMessage: created, updatedAt: created.createdAt },
        ...items.filter((item) => item.id !== selected.id),
      ]);
    } catch (sendError) { setError(getApiErrorMessage(sendError)); }
    finally { setIsSending(false); }
  };

  useEffect(() => { if (isOpen) { setSelected(null); setMessages([]); void loadConversations(); } }, [isOpen]);
  useEffect(() => {
    if (!latestMessage) return;
    setConversations((items) => items.map((item) => item.id === latestMessage.conversationId ? { ...item, latestMessage, updatedAt: latestMessage.createdAt } : item).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
    if (selected?.id === latestMessage.conversationId) {
      setMessages((items) => items.some((item) => item.id === latestMessage.id) ? items : [...items, latestMessage]);
      if (latestMessage.senderId !== user?.id) void markConversationMessagesRead(selected.id).then(onMessagesRead).catch(() => undefined);
    }
  }, [latestMessage, onMessagesRead, selected, user?.id]);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs"><aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
    <header className="flex items-center justify-between border-b border-slate-200 bg-slate-900 p-4 text-white">
      <div className="flex items-center gap-3">{selected && <button onClick={() => setSelected(null)} aria-label="Quay lại"><ArrowLeft className="h-5 w-5" /></button>}<MessageSquare className="h-5 w-5" /><div><h3 className="text-sm font-bold">{selected?.participant.name ?? 'Tin nhắn'}</h3><p className="text-[11px] text-slate-300">{selected?.internship.title ?? 'Hội thoại ứng tuyển'}</p></div></div>
      <button onClick={onClose} aria-label="Đóng chat" className="rounded-lg p-1 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
    </header>
    {error && <div className="m-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    {!selected ? <div className="flex-1 overflow-y-auto bg-slate-50 p-3">{isLoading && <p className="py-10 text-center text-sm text-slate-500">Đang tải…</p>}{!isLoading && !error && conversations.length === 0 && <div className="py-16 text-center text-slate-500"><MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="text-sm font-medium">Chưa có hội thoại</p></div>}{conversations.map((conversation) => <button key={conversation.id} onClick={() => void openConversation(conversation)} className="mb-2 flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-blue-300"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{conversation.participant.name.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="truncate text-sm">{conversation.participant.name}</strong><time className="text-[10px] text-slate-400">{dateTime(conversation.updatedAt)}</time></span><span className="block truncate text-xs text-slate-500">{conversation.internship.title}</span><span className="block truncate text-xs text-slate-600">{conversation.latestMessage?.content ?? 'Chưa có tin nhắn'}</span></span></button>)}</div> : <><div className="flex-1 overflow-y-auto bg-slate-50 p-4">{isLoading ? <p className="py-10 text-center text-sm text-slate-500">Đang tải tin nhắn…</p> : messages.map((message) => <div key={message.id} className={`mb-3 flex flex-col ${message.senderId === user?.id ? 'items-end' : 'items-start'}`}><p className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.senderId === user?.id ? 'rounded-tr-none bg-blue-600 text-white' : 'rounded-tl-none border border-slate-200 bg-white text-slate-800'}`}>{message.content}</p><time className="mt-1 text-[10px] text-slate-400">{dateTime(message.createdAt)}</time></div>)}</div><form onSubmit={(event) => void submit(event)} className="flex gap-2 border-t border-slate-200 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} placeholder="Nhập tin nhắn..." className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" /><button disabled={isSending || !input.trim()} className="rounded-xl bg-blue-600 p-2.5 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form></>}
  </aside></div>;
}
