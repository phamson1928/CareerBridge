import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../auth/api";
import {
  createConversation,
  listConversations,
  listMessages,
  markConversationMessagesRead,
  sendMessage,
} from "../../chat/api";
import type { ChatMessage, Conversation } from "../../chat/types";
import { placementsApi } from "../../placements/api";
import type { PlacementRecord } from "../../placements/types";
import { ProfileAvatarPreview } from "../ProfileAvatarUpload";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  latestMessage: ChatMessage | null;
  onMessagesRead: () => Promise<void>;
}

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));

export function ChatDrawer({
  isOpen,
  onClose,
  latestMessage,
  onMessagesRead,
}: ChatDrawerProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [supervisedPlacements, setSupervisedPlacements] = useState<
    PlacementRecord[]
  >([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    setError(null);
    try {
      const [conversationPage, placementPage] = await Promise.all([
        listConversations({ page: 1, limit: 50 }),
        user?.role === "STUDENT" || user?.role === "LECTURER"
          ? placementsApi.listMine()
          : Promise.resolve(null),
      ]);
      setConversations(conversationPage.items);
      setSupervisedPlacements(
        (placementPage?.items ?? []).filter(
          (placement) => placement.supervision?.status === "ACTIVE",
        ),
      );
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const startLecturerConversation = async (placement: PlacementRecord) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const conversation = await createConversation({
        placementId: placement.id,
      });
      setConversations((items) => [
        conversation,
        ...items.filter((item) => item.id !== conversation.id),
      ]);
      await openConversation(conversation);
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const openConversation = async (conversation: Conversation) => {
    setSelected(conversation);
    setIsLoadingMessages(true);
    setError(null);
    try {
      const page = await listMessages(conversation.id, { page: 1, limit: 100 });
      setMessages(page.items);
      await markConversationMessagesRead(conversation.id);
      await onMessagesRead();
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !input.trim() || isSending) return;
    setIsSending(true);
    try {
      const created = await sendMessage(selected.id, input.trim());
      setMessages((items) =>
        items.some((item) => item.id === created.id)
          ? items
          : [...items, created],
      );
      setInput("");
      setConversations((items) => [
        { ...selected, latestMessage: created, updatedAt: created.createdAt },
        ...items.filter((item) => item.id !== selected.id),
      ]);
    } catch (sendError) {
      setError(getApiErrorMessage(sendError));
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setMessages([]);
      void loadConversations();
    }
  }, [isOpen]);
  useEffect(() => {
    if (!latestMessage) return;
    setConversations((items) =>
      items
        .map((item) =>
          item.id === latestMessage.conversationId
            ? { ...item, latestMessage, updatedAt: latestMessage.createdAt }
            : item,
        )
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    );
    if (selected?.id === latestMessage.conversationId) {
      setMessages((items) =>
        items.some((item) => item.id === latestMessage.id)
          ? items
          : [...items, latestMessage],
      );
      if (latestMessage.senderId !== user?.id)
        void markConversationMessagesRead(selected.id)
          .then(onMessagesRead)
          .catch(() => undefined);
    }
  }, [latestMessage, onMessagesRead, selected, user?.id]);
  useLayoutEffect(() => {
    if (!selected || isLoadingMessages) return;
    const container = messageScrollRef.current;
    const frame = window.requestAnimationFrame(() => {
      container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selected?.id, messages.length, isLoadingMessages]);
  if (!isOpen) return null;
  // A placement that already owns a conversation belongs in the inbox only.
  // This prevents the "start a chat" shortcuts from duplicating contacts.
  const startablePlacements = supervisedPlacements.filter(
    (placement) => !conversations.some((conversation) => conversation.placementId === placement.id),
  );
  const normalizedContactSearch = contactSearch.trim().toLocaleLowerCase("vi-VN");
  const visibleConversations = normalizedContactSearch
    ? conversations.filter((conversation) => conversation.participant.name.toLocaleLowerCase("vi-VN").includes(normalizedContactSearch))
    : conversations;
  const visibleStartablePlacements = normalizedContactSearch
    ? startablePlacements.filter((placement) => {
        const person = user?.role === "LECTURER" ? placement.student : placement.supervision?.lecturer;
        return person?.fullName.toLocaleLowerCase("vi-VN").includes(normalizedContactSearch);
      })
    : startablePlacements;
  return (
    <div className="chat-backdrop fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <aside className="chat-drawer flex h-full w-full max-w-[50rem] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="chat-header flex h-16 items-center justify-between border-b border-slate-200 px-5 text-white">
          <div className="flex items-center gap-3">
            {selected && (
              <button className="md:hidden" onClick={() => setSelected(null)} aria-label="Quay lại">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-sm font-bold">Tin nhắn</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng chat"
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        {error && (
          <div className="m-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="chat-layout flex min-h-0 flex-1">
          <div className={`chat-conversation-list min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:max-w-[19rem] md:flex-none ${selected ? "hidden md:block" : ""}`}>
            <label className="chat-contact-search mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search className="h-4 w-4 text-teal-700" />
              <input value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Tìm theo tên..." className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" aria-label="Tìm kiếm danh bạ" />
            </label>
            {isLoadingConversations && conversations.length === 0 && startablePlacements.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Đang tải…
              </p>
            )}
            {!isLoadingConversations && !error && visibleConversations.length === 0 && visibleStartablePlacements.length === 0 && (
              <div className="py-10 text-center text-slate-500">
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium">Chưa có hội thoại</p>
              </div>
            )}
            {visibleStartablePlacements.map((placement, index) => {
              const person = user?.role === "LECTURER" ? placement.student : placement.supervision?.lecturer;
              return (
                <button
                  key={placement.id}
                  onClick={() => void startLecturerConversation(placement)}
                  className="chat-conversation chat-contact flex w-full items-start gap-3 bg-white p-4 text-left"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <ProfileAvatarPreview
                    fileId={person?.avatarFileId}
                    fallback={person?.fullName.charAt(0).toUpperCase() ?? "G"}
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-bold text-indigo-700"
                    imageClassName="h-full w-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{person?.fullName}</strong>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{placement.internship.title}</span>
                    <span className="mt-1 block text-xs font-medium text-teal-700">Sẵn sàng trao đổi</span>
                  </span>
                </button>
              );
            })}
            {visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => void openConversation(conversation)}
                className={`chat-conversation flex w-full items-start gap-3 bg-white p-4 text-left ${selected?.id === conversation.id ? "is-active" : ""}`}
              >
                <ProfileAvatarPreview
                  fileId={conversation.participant.avatarFileId}
                  fallback={conversation.participant.name
                    .charAt(0)
                    .toUpperCase()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700"
                  imageClassName="h-full w-full object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <strong className="truncate text-sm">
                      {conversation.participant.name}
                    </strong>
                    <time className="text-[10px] text-slate-400">
                      {dateTime(conversation.updatedAt)}
                    </time>
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {conversation.internship?.title ?? "Kỳ thực tập"}
                  </span>
                  <span className="block truncate text-xs text-slate-600">
                    {conversation.latestMessage?.content ?? "Chưa có tin nhắn"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {selected ? (
          <div className="chat-thread-panel flex min-w-0 flex-1 flex-col">
            <div className="chat-thread-header flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3.5">
              <ProfileAvatarPreview fileId={selected.participant.avatarFileId} fallback={selected.participant.name.charAt(0).toUpperCase()} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-xs font-bold text-teal-700" imageClassName="h-full w-full object-cover" />
              <div className="min-w-0"><h4 className="truncate text-sm font-bold text-slate-800">{selected.participant.name}</h4><p className="truncate text-xs text-slate-500">{selected.internship?.title ?? "Hội thoại thực tập"}</p></div>
            </div>
            <div ref={messageScrollRef} className="chat-messages flex-1 overflow-y-auto bg-slate-50 p-5">
              {isLoadingMessages ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Đang tải tin nhắn…
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message mb-3 flex flex-col ${message.senderId === user?.id ? "items-end" : "items-start"}`}
                  >
                    <p
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.senderId === user?.id ? "rounded-tr-none bg-blue-600 text-white" : "rounded-tl-none border border-slate-200 bg-white text-slate-800"}`}
                    >
                      {message.content}
                    </p>
                    <time className="mt-1 text-[10px] text-slate-400">
                      {dateTime(message.createdAt)}
                    </time>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(event) => void submit(event)}
              className="chat-compose flex gap-2 border-t border-slate-200 p-4"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={4000}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                disabled={isSending || !input.trim()}
                className="chat-send rounded-2xl bg-blue-600 p-3 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
          ) : (
            <div className="chat-empty-state hidden flex-1 flex-col items-center justify-center bg-[#fbfefe] px-8 text-center md:flex"><MessageSquare className="mb-3 h-10 w-10 text-teal-200" /><p className="text-sm font-bold text-slate-700">Chọn một liên hệ</p><p className="mt-1 text-xs text-slate-500">Mở hội thoại để bắt đầu trao đổi.</p></div>
          )}
        </div>
      </aside>
    </div>
  );
}
