"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, Mail, Reply, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CONTACT_SUBJECT_LABEL,
  emitContactUnread,
  fetchContactMessages,
  updateContactStatus,
  type ApiContactMessage,
  type ContactStatus,
} from '@/lib/api/contact';
import { formatOrderDateTime } from '@/lib/api/orders';
import { notifyError, notifySuccess } from '@/lib/notify';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';

type InboxFilter = 'all' | 'unread' | 'archived';

function unreadCount(list: ApiContactMessage[]) {
  return list.filter((m) => m.status === 'NEW').length;
}

function syncUnreadBadge(list: ApiContactMessage[]) {
  emitContactUnread(unreadCount(list));
}

function initials(msg: ApiContactMessage) {
  const a = msg.firstName?.[0] || msg.email[0] || 'M';
  const b = msg.lastName?.[0] || '';
  return `${a}${b}`.toUpperCase();
}

function preview(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 72);
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return formatOrderDateTime(iso);
  const diff = Date.now() - then;
  const min = Math.max(0, Math.floor(diff / 60_000));
  if (min < 1) return 'À l’instant';
  if (min < 60) return `Il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return formatOrderDateTime(iso);
}

function matchesFilter(msg: ApiContactMessage, filter: InboxFilter) {
  if (filter === 'unread') return msg.status === 'NEW';
  if (filter === 'archived') return msg.status === 'ARCHIVED';
  return msg.status !== 'ARCHIVED';
}

function matchesSearch(msg: ApiContactMessage, query: string) {
  if (!query) return true;
  const hay = [
    msg.firstName,
    msg.lastName,
    msg.email,
    CONTACT_SUBJECT_LABEL[msg.subject],
    msg.message,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(query);
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ApiContactMessage[]>([]);
  const [selected, setSelected] = useState<ApiContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContactMessages();
      setMessages(data);
      syncUnreadBadge(data);
      setSelected((prev) => {
        if (!prev) return null;
        return data.find((m) => m.id === prev.id) ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchApplied(search.trim().toLowerCase()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setSelected((prev) => {
      if (!prev) return null;
      const stillThere = messagesRef.current.some(
        (m) =>
          m.id === prev.id &&
          matchesFilter(m, filter) &&
          matchesSearch(m, searchApplied),
      );
      return stillThere ? prev : null;
    });
  }, [filter, searchApplied]);

  const counts = useMemo(
    () => ({
      all: messages.filter((m) => m.status !== 'ARCHIVED').length,
      unread: unreadCount(messages),
      archived: messages.filter((m) => m.status === 'ARCHIVED').length,
    }),
    [messages],
  );

  const visible = useMemo(
    () =>
      messages.filter(
        (m) => matchesFilter(m, filter) && matchesSearch(m, searchApplied),
      ),
    [messages, filter, searchApplied],
  );

  const setStatus = async (id: string, status: ContactStatus) => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateContactStatus(id, status);
      let nextList: ApiContactMessage[] = [];
      setMessages((prev) => {
        nextList = prev.map((m) => (m.id === id ? updated : m));
        syncUnreadBadge(nextList);
        return nextList;
      });
      const nextVisible = nextList.filter(
        (m) => matchesFilter(m, filter) && matchesSearch(m, searchApplied),
      );
      setSelected((prev) => {
        if (status === 'ARCHIVED' && filter !== 'archived') {
          return nextVisible.find((m) => m.id !== id) ?? nextVisible[0] ?? null;
        }
        if (status === 'READ' && filter === 'archived') {
          return nextVisible.find((m) => m.id !== id) ?? nextVisible[0] ?? null;
        }
        return updated;
      });
      notifySuccess(
        status === 'ARCHIVED' ? 'Message archivé.' : 'Message restauré.',
      );
    } catch (err) {
      notifyError(err, 'Erreur statut');
    } finally {
      setSaving(false);
    }
  };

  const openMessage = (msg: ApiContactMessage) => {
    setSelected(msg);
    if (msg.status !== 'NEW') return;

    const optimistic = { ...msg, status: 'READ' as const };
    setSelected(optimistic);
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === msg.id ? optimistic : m));
      syncUnreadBadge(next);
      return next;
    });

    void updateContactStatus(msg.id, 'READ')
      .then((updated) => {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === updated.id ? updated : m));
          syncUnreadBadge(next);
          return next;
        });
        setSelected((prev) => (prev?.id === updated.id ? updated : prev));
      })
      .catch((err) => {
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === msg.id ? msg : m));
          syncUnreadBadge(next);
          return next;
        });
        setSelected((prev) => (prev?.id === msg.id ? msg : prev));
        notifyError(err, 'Impossible de marquer comme lu');
      });
  };

  const emptyHint = searchApplied
    ? `Aucun message pour « ${search} ».`
    : filter === 'unread'
      ? 'Aucun message non lu.'
      : filter === 'archived'
        ? 'Aucun message archivé.'
        : 'Aucun message pour le moment.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic">Messages</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
            Inbox contact
            {!loading
              ? ` · ${counts.unread} non lu${counts.unread > 1 ? 's' : ''}`
              : ''}
          </p>
        </div>
        <form
          className="relative w-full md:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchApplied(search.trim().toLowerCase());
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zay-text-muted" />
          <Input
            placeholder="Nom, email, sujet…"
            className="pl-10 h-10 border-zay-border bg-white rounded-none text-xs tracking-widest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as InboxFilter)}
        className="w-full"
      >
        <TabsList className="bg-zay-gray rounded-none p-1 h-auto flex-wrap">
          <TabsTrigger
            value="all"
            className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none"
          >
            Tous ({counts.all})
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none"
          >
            Non lus ({counts.unread})
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="text-[0.6rem] tracking-[0.1em] font-bold uppercase py-2 px-4 data-[state=active]:bg-white rounded-none"
          >
            Archivés ({counts.archived})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative min-h-[480px] border border-zay-border bg-white shadow-sm overflow-hidden">
        <AdminBusyOverlay
          show={loading || saving}
          label={saving ? 'Enregistrement…' : 'Chargement des messages…'}
        />

        {!loading && error && messages.length === 0 ? (
          <div className="p-16 text-center text-sm text-red-500 italic">{error}</div>
        ) : !loading && messages.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Mail className="w-8 h-8 mx-auto text-primary" />
            <p className="text-sm italic text-zay-text-muted">Aucun message pour le moment.</p>
            <p className="text-[0.65rem] text-zay-text-muted max-w-sm mx-auto leading-relaxed">
              Ils arriveront ici dès qu’une cliente enverra le formulaire Contact de la boutique.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[320px_1fr] min-h-[480px]">
            <div className="border-r border-zay-border max-h-[640px] overflow-y-auto divide-y divide-zay-border">
              {visible.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <Mail className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-xs italic text-zay-text-muted">{emptyHint}</p>
                </div>
              ) : (
                visible.map((msg) => {
                  const unread = msg.status === 'NEW';
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => openMessage(msg)}
                      className={cn(
                        'w-full text-left p-4 transition-colors hover:bg-zay-rose-pale/30 flex gap-3',
                        selected?.id === msg.id &&
                          'bg-zay-rose-pale/50 border-l-4 border-l-primary',
                      )}
                    >
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zay-gray text-[0.6rem] font-bold">
                        {initials(msg)}
                        {unread && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 mb-0.5">
                          <span
                            className={cn(
                              'text-xs tracking-wide truncate',
                              unread && 'font-bold',
                            )}
                          >
                            {msg.firstName} {msg.lastName}
                          </span>
                          <span className="shrink-0 text-[0.5rem] text-zay-text-muted italic">
                            {formatRelative(msg.createdAt)}
                          </span>
                        </span>
                        <span className="block text-[0.6rem] text-zay-text-muted uppercase tracking-widest truncate">
                          {CONTACT_SUBJECT_LABEL[msg.subject]}
                        </span>
                        <span className="block text-[0.65rem] text-zay-text-muted italic mt-1 truncate">
                          {preview(msg.message) || '—'}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-8">
              {!selected ? (
                <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-zay-text-muted gap-3">
                  <Mail size={28} />
                  <p className="text-xs italic">Sélectionnez un message</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zay-gray text-[0.65rem] font-bold">
                        {initials(selected)}
                      </span>
                      <div>
                        <h2 className="text-2xl font-headline italic">
                          {selected.firstName} {selected.lastName}
                        </h2>
                        <a
                          href={`mailto:${selected.email}`}
                          className="text-xs text-zay-text-muted tracking-widest mt-1 hover:text-primary"
                        >
                          {selected.email}
                        </a>
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-primary mt-3">
                          {CONTACT_SUBJECT_LABEL[selected.subject]}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.status === 'NEW' && (
                        <Badge className="rounded-none text-[0.5rem] tracking-widest uppercase bg-primary text-white">
                          Non lu
                        </Badge>
                      )}
                      {selected.status === 'ARCHIVED' && (
                        <Badge className="rounded-none text-[0.5rem] tracking-widest uppercase bg-zay-gray text-zay-text-muted">
                          Archivé
                        </Badge>
                      )}
                      <Button
                        asChild
                        className="bg-primary hover:bg-zay-text text-white rounded-none h-10 text-[0.6rem] tracking-[0.15em] font-bold uppercase"
                      >
                        <a
                          href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(
                            `Re: ${CONTACT_SUBJECT_LABEL[selected.subject]} — ZAY`,
                          )}&body=${encodeURIComponent(
                            `\n\n---\nMessage de ${selected.firstName} ${selected.lastName} :\n${selected.message}`,
                          )}`}
                        >
                          <Reply className="w-3 h-3 mr-2" /> Répondre
                        </a>
                      </Button>
                      {selected.status !== 'ARCHIVED' && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={saving}
                          onClick={() => void setStatus(selected.id, 'ARCHIVED')}
                          className="rounded-none border-zay-border h-10 text-[0.6rem] tracking-[0.15em] font-bold uppercase"
                        >
                          <Archive className="w-3 h-3 mr-2" /> Archiver
                        </Button>
                      )}
                      {selected.status === 'ARCHIVED' && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={saving}
                          onClick={() => void setStatus(selected.id, 'READ')}
                          className="rounded-none border-zay-border h-10 text-[0.6rem] tracking-[0.15em] font-bold uppercase"
                        >
                          Restaurer
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-[0.65rem] text-zay-text-muted italic">
                    {formatOrderDateTime(selected.createdAt)}
                  </p>
                  <div className="border-t border-zay-border pt-6">
                    <p className="text-sm leading-relaxed tracking-wide whitespace-pre-wrap">
                      {selected.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
