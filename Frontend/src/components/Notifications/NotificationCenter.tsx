import React, { useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle, Award, Bell, BriefcaseBusiness, Building2, Check,
  ClipboardCheck, FileCheck2, GraduationCap, Info, Loader2, RefreshCw,
  ShieldCheck, Wifi, WifiOff, X,
} from 'lucide-react';
import type { AppNotification, NotificationAction, NotificationFilter } from '../../notifications/types';

interface NotificationCenterProps {
  isOpen: boolean; onClose: () => void; notifications: AppNotification[];
  unreadCount: number; filter: NotificationFilter; onFilterChange: (filter: NotificationFilter) => void;
  isLoading: boolean; isLoadingMore: boolean; isMarkingAll: boolean; hasMore: boolean;
  error: string | null; socketStatus: 'offline' | 'connecting' | 'online'; onRefresh: () => void;
  onLoadMore: () => void; onMarkAsRead: (id: string) => void; onMarkAllAsRead: () => void;
  onNavigate: (action: NotificationAction, resourceId: string | null) => void;
}

const iconByType = {
  APPLICATION: <FileCheck2 className="h-4 w-4 text-emerald-600" />,
  REPORT: <ClipboardCheck className="h-4 w-4 text-sky-600" />,
  SUPERVISION: <GraduationCap className="h-4 w-4 text-violet-600" />,
  PLACEMENT: <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />,
  COMPANY: <Building2 className="h-4 w-4 text-amber-600" />,
  EVALUATION: <Award className="h-4 w-4 text-fuchsia-600" />,
  SYSTEM: <Info className="h-4 w-4 text-slate-500" />,
} as const;

function relativeTime(value: string) {
  const diff = Date.now() - Date.parse(value); if (!Number.isFinite(diff)) return 'Vừa xong';
  const minutes = Math.floor(diff / 60000); if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`; const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`; const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export const NotificationCenter: React.FC<NotificationCenterProps> = (props) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const emptyLabel = useMemo(() => props.filter === 'UNREAD' ? 'Bạn đã đọc tất cả thông báo' : 'Bạn chưa có thông báo nào', [props.filter]);

  useEffect(() => {
    if (!props.isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') props.onClose(); };
    document.addEventListener('keydown', onKeyDown); return () => document.removeEventListener('keydown', onKeyDown);
  }, [props.isOpen, props.onClose]);

  useEffect(() => {
    if (!props.isOpen || !props.hasMore || !props.notifications.length) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) props.onLoadMore(); }, { rootMargin: '160px' });
    if (bottomRef.current) observer.observe(bottomRef.current); return () => observer.disconnect();
  }, [props.hasMore, props.isLoadingMore, props.isOpen, props.notifications.length, props.onLoadMore]);

  if (!props.isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}>
      <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="notification-title">
        <header className="border-b border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600"><Bell className="h-5 w-5" /></span><div><h2 id="notification-title" className="text-base font-bold text-slate-900">Thông báo</h2><p className="mt-0.5 text-xs text-slate-500">Cập nhật mới nhất từ InternConnect</p></div></div><button type="button" onClick={props.onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng thông báo"><X className="h-5 w-5" /></button></div>
          <div className="mt-4 flex items-center justify-between gap-3"><div className="flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Bộ lọc thông báo">{(['ALL', 'UNREAD'] as NotificationFilter[]).map((item) => <button key={item} type="button" role="tab" aria-selected={props.filter === item} onClick={() => props.onFilterChange(item)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${props.filter === item ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{item === 'ALL' ? 'Tất cả' : `Chưa đọc${props.unreadCount ? ` (${props.unreadCount})` : ''}`}</button>)}</div><div className="flex items-center gap-1.5 text-[11px] text-slate-400">{props.socketStatus === 'online' ? <><Wifi className="h-3.5 w-3.5 text-emerald-500" /><span>Realtime</span></> : props.socketStatus === 'connecting' ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /><span>Đang kết nối</span></> : <><WifiOff className="h-3.5 w-3.5" /><span>Offline</span></>}</div></div>
        </header>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3"><span className="text-xs text-slate-500">{props.unreadCount ? `${props.unreadCount} thông báo chưa đọc` : 'Bạn đã cập nhật đầy đủ'}</span><div className="flex items-center gap-1"><button type="button" onClick={props.onRefresh} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600" aria-label="Làm mới thông báo"><RefreshCw className={`h-4 w-4 ${props.isLoading ? 'animate-spin' : ''}`} /></button><button type="button" disabled={!props.unreadCount || props.isMarkingAll} onClick={props.onMarkAllAsRead} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-3.5 w-3.5" /> Đọc tất cả</button></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {props.error && <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{props.error}</span><button type="button" onClick={props.onRefresh} className="font-bold underline">Thử lại</button></div>}
          {props.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="animate-pulse rounded-xl border border-slate-100 p-4"><div className="flex gap-3"><div className="h-9 w-9 rounded-lg bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-3 w-3/4 rounded bg-slate-100" /><div className="h-2.5 w-full rounded bg-slate-100" /><div className="h-2.5 w-1/3 rounded bg-slate-100" /></div></div></div>)}</div> : props.notifications.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><span className="rounded-2xl bg-slate-100 p-4 text-slate-300"><Bell className="h-8 w-8" /></span><p className="mt-4 text-sm font-semibold text-slate-600">{emptyLabel}</p><p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-400">Các thay đổi quan trọng về hồ sơ, ứng tuyển và placement sẽ xuất hiện tại đây.</p></div> : <div className="space-y-2">{props.notifications.map((notification) => <article key={notification.id} role="button" tabIndex={0} onClick={() => { props.onMarkAsRead(notification.id); props.onNavigate(notification.action, notification.resourceId); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); props.onMarkAsRead(notification.id); props.onNavigate(notification.action, notification.resourceId); } }} className={`group cursor-pointer rounded-xl border p-3.5 outline-none transition focus:ring-2 focus:ring-indigo-300 ${notification.isRead ? 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50' : 'border-indigo-100 bg-indigo-50/65 shadow-sm hover:border-indigo-200'}`}><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">{iconByType[notification.type] ?? <ShieldCheck className="h-4 w-4 text-slate-500" />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className={`text-sm leading-5 ${notification.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notification.title}</h3>{!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-label="Chưa đọc" />}</div><p className="mt-1 text-xs leading-5 text-slate-600">{notification.content}</p><time className="mt-2 block text-[11px] text-slate-400" dateTime={notification.createdAt} title={new Date(notification.createdAt).toLocaleString('vi-VN')}>{relativeTime(notification.createdAt)}</time></div></div></article>)}<div ref={bottomRef} className="h-2" />{props.isLoadingMore && <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>}</div>}
        </div>
      </aside>
    </div>
  );
};
