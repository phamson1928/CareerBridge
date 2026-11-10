import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  X,
  User,
  Building,
  CheckCheck,
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
  initialPlacementId?: string | null;
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
  initialPlacementId,
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
      const placements = (placementPage?.items ?? []).filter(
        (placement) => placement.supervision?.status === "ACTIVE",
      );
      setConversations(conversationPage.items);
      setSupervisedPlacements(placements);
      return { conversations: conversationPage.items, placements };
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
      return null;
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
      void loadConversations().then(async (loaded) => {
        if (!loaded || !initialPlacementId) return;
        try {
          const existing = loaded.conversations.find(
            (conversation) => conversation.placementId === initialPlacementId,
          );
          const conversation =
            existing ??
            (await createConversation({ placementId: initialPlacementId }));
          setConversations((items) => [
            conversation,
            ...items.filter((item) => item.id !== conversation.id),
          ]);
          await openConversation(conversation);
        } catch (createError) {
          setError(getApiErrorMessage(createError));
        }
      });
    }
  }, [initialPlacementId, isOpen]);

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
    <div className="chat-backdrop fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <aside className="chat-drawer flex h-full w-full max-w-[54rem] flex-col border-l border-slate-200 bg-white shadow-2xl">
        {/* Modern Clean Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            {selected && (
              <button
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
                onClick={() => setSelected(null)}
                aria-label="Quay lại danh bạ"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200/80 bg-teal-50 text-teal-700">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Tin nhắn &amp; Trao đổi thực tập
              </h3>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Kênh liên lạc trực tiếp theo thời gian thực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadConversations()}
              disabled={isLoadingConversations}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingConversations ? "animate-spin text-teal-600" : ""}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Đóng chat"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-4 mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* Conversation List / Contacts Sidebar */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto border-r border-slate-200/80 bg-slate-50/70 p-3.5 md:w-80 md:flex-none ${
              selected ? "hidden md:block" : ""
            }`}
          >
            {/* Search Box */}
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
                placeholder="Tìm theo tên..."
                className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                aria-label="Tìm kiếm danh bạ"
              />
            </div>

            {isLoadingConversations && conversations.length === 0 && startablePlacements.length === 0 && (
              <p className="py-12 text-center text-xs text-slate-400">
                Đang tải danh bạ…
              </p>
            )}

            {!isLoadingConversations && !error && visibleConversations.length === 0 && visibleStartablePlacements.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Chưa có hội thoại</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Các ứng viên và người liên quan sẽ xuất hiện tại đây.</p>
              </div>
            )}

            {/* Quick Contacts (Startable) */}
            {visibleStartablePlacements.map((placement) => {
              const person = user?.role === "LECTURER" ? placement.student : placement.supervision?.lecturer;
              return (
                <button
                  key={placement.id}
                  onClick={() => void startLecturerConversation(placement)}
                  className="mb-1.5 flex w-full items-start gap-3 rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-3 text-left transition hover:bg-teal-50 cursor-pointer"
                >
                  <ProfileAvatarPreview
                    fileId={person?.avatarFileId}
                    fallback={person?.fullName.charAt(0).toUpperCase() ?? "U"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 font-bold text-teal-800"
                    imageClassName="h-full w-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-bold text-slate-900">
                      {person?.fullName}
                    </strong>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {placement.internship.title}
                    </span>
                    <span className="mt-1 inline-block rounded-md bg-teal-100/70 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                      Bắt đầu trao đổi →
                    </span>
                  </span>
                </button>
              );
            })}

            {/* Existing Conversations */}
            {visibleConversations.map((conversation) => {
              const isSelected = selected?.id === conversation.id;
              return (
                <button
                  key={conversation.id}
                  onClick={() => void openConversation(conversation)}
                  className={`chat-contact mb-1.5 flex w-full items-start gap-3 rounded-xl p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? "border border-teal-200 bg-white shadow-xs ring-1 ring-teal-500/20"
                      : "border border-transparent bg-white/70 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <ProfileAvatarPreview
                    fileId={conversation.participant.avatarFileId}
                    fallback={conversation.participant.name.charAt(0).toUpperCase()}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-xs ${
                      isSelected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                    imageClassName="h-full w-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-1">
                      <strong className={`truncate text-xs font-bold ${isSelected ? "text-teal-900" : "text-slate-900"}`}>
                        {conversation.participant.name}
                      </strong>
                      <time className="shrink-0 text-[10px] text-slate-400">
                        {dateTime(conversation.updatedAt)}
                      </time>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-teal-700">
                      {conversation.internship?.title ?? "Hội thoại thực tập"}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {conversation.latestMessage?.content ?? "Chưa có tin nhắn"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chat Thread Panel */}
          {selected ? (
            <div className="chat-thread-panel flex min-w-0 flex-1 flex-col bg-white">
              {/* Active Conversation Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <ProfileAvatarPreview
                    fileId={selected.participant.avatarFileId}
                    fallback={selected.participant.name.charAt(0).toUpperCase()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-xs font-bold text-teal-800"
                    imageClassName="h-full w-full object-cover"
                  />
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-bold text-slate-900">
                      {selected.participant.name}
                    </h4>
                    <p className="truncate text-[11px] text-slate-500">
                      {selected.internship?.title ?? "Hội thoại thực tập"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Sẵn sàng</span>
                </div>
              </div>

              {/* Messages Container */}
              <div
                ref={messageScrollRef}
                className="flex-1 overflow-y-auto bg-slate-50/50 p-5 space-y-3"
              >
                {isLoadingMessages ? (
                  <p className="py-12 text-center text-xs text-slate-400">
                    Đang tải tin nhắn…
                  </p>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`chat-message flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-2xs leading-relaxed ${
                            isMine
                              ? "rounded-tr-xs bg-teal-700 text-white"
                              : "rounded-tl-xs border border-slate-200/90 bg-white text-slate-800"
                          }`}
                        >
                          {message.content}
                        </div>
                        <time className={`mt-1 text-[10px] text-slate-400 ${isMine ? "mr-1" : "ml-1"}`}>
                          {dateTime(message.createdAt)}
                        </time>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compose Bar */}
              <form
                onSubmit={(event) => void submit(event)}
                className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-3.5"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={4000}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition font-medium"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-700 p-2.5 text-white shadow-xs hover:bg-teal-800 disabled:opacity-40 transition cursor-pointer"
                  title="Gửi tin nhắn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center bg-slate-50/40 p-8 text-center md:flex">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200/70 bg-teal-50 text-teal-600 mb-3 shadow-2xs">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Chọn một liên hệ</p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Chọn ứng viên hoặc người hướng dẫn từ danh bạ bên trái để bắt đầu trao đổi thông tin.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
