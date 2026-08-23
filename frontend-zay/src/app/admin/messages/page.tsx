"use client"

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Archive, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CONTACT_SUBJECT_LABEL,
  fetchContactMessages,
  updateContactStatus,
  type ApiContactMessage,
  type ContactStatus,
} from '@/lib/api/contact';
import { formatOrderDateTime } from '@/lib/api/orders';
import { notifyError } from '@/lib/notify';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ApiContactMessage[]>([]);
  const [selected, setSelected] = useState<ApiContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContactMessages();
      setMessages(data);
      setSelected((prev) => {
        if (!prev) return data[0] ?? null;
        return data.find((m) => m.id === prev.id) ?? data[0] ?? null;
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

  const setStatus = async (id: string, status: ContactStatus) => {
    setSaving(true);
    try {
      await updateContactStatus(id, status);
      await load();
    } catch (err) {
      notifyError(err, 'Erreur statut');
    } finally {
      setSaving(false);
    }
  };

  const openMessage = async (msg: ApiContactMessage) => {
    setSelected(msg);
    if (msg.status === 'NEW') {
      await setStatus(msg.id, 'READ');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 italic">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline italic">Messages</h1>
        <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">
          Inbox contact — {messages.filter((m) => m.status === 'NEW').length} non lus
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 border border-zay-border bg-white shadow-sm min-h-[480px]">
        <div className="border-r border-zay-border divide-y divide-zay-border max-h-[640px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-xs italic text-zay-text-muted">Aucun message.</div>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => void openMessage(msg)}
                className={cn(
                  "w-full text-left p-4 transition-colors hover:bg-zay-rose-pale/30",
                  selected?.id === msg.id && "bg-zay-rose-pale/50 border-l-4 border-l-primary",
                  msg.status === 'NEW' && "font-bold"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs tracking-wide">
                    {msg.firstName} {msg.lastName}
                  </span>
                  {msg.status === 'NEW' && (
                    <Badge className="rounded-none text-[0.45rem] tracking-widest uppercase bg-primary text-white">
                      Nouveau
                    </Badge>
                  )}
                </div>
                <p className="text-[0.6rem] text-zay-text-muted uppercase tracking-widest">
                  {CONTACT_SUBJECT_LABEL[msg.subject]}
                </p>
                <p className="text-[0.55rem] text-zay-text-muted italic mt-1">
                  {formatOrderDateTime(msg.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="p-8">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-zay-text-muted gap-3">
              <Mail size={28} />
              <p className="text-xs italic">Sélectionnez un message</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-headline italic">
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <p className="text-xs text-zay-text-muted tracking-widest mt-1">{selected.email}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-primary mt-3">
                    {CONTACT_SUBJECT_LABEL[selected.subject]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
