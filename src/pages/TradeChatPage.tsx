import { BackButton } from "@/components/BackButton";
import {
  getPublicProfile,
  getThread,
  sendTextMessage,
  subscribeToMessages,
  type ChatMessage,
} from "@/features/trades/threadsService";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export function TradeChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const userId = useAuthStore((s) => s.userId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerName, setPeerName] = useState("Treinador");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId || !userId) return;
    let cancelled = false;
    void getThread(threadId).then((thread) => {
      if (cancelled || !thread) return;
      const peerId = thread.participantIds.find((id) => id !== userId);
      if (!peerId) return;
      void getPublicProfile(peerId).then((p) => {
        if (!cancelled && p) setPeerName(p.displayName);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [threadId, userId]);

  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToMessages(
      threadId,
      (msgs) => setMessages(msgs),
      (err) => {
        console.warn("[Chat]", err);
        setError("Falha ao carregar mensagens.");
      },
    );
    return unsub;
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!threadId || !userId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendTextMessage(threadId, userId, draft);
      setDraft("");
    } catch (err) {
      console.warn("[Chat] send", err);
      setError("Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  };

  if (!threadId || !userId) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Conversa inválida.</p>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-lg flex-col md:h-[calc(100dvh-3rem)]">
      <header className="mb-3 flex items-center gap-3">
        <BackButton to="/trades">Trocas</BackButton>
        <h1 className="min-w-0 flex-1 truncate font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-text)]">
          {peerName}
        </h1>
      </header>

      <p className="mb-3 text-xs text-[var(--color-text-muted)]">
        Chat simples para combinar a troca. Grupos da cidade ficam no WhatsApp
        (aba Comunidade).
      </p>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              Diga oi e combine a troca.
            </p>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderId === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="px-3 pb-1 text-xs text-[var(--color-error)]">{error}</p>
        ) : null}

        <form
          className="flex gap-2 border-t border-[var(--color-border)] p-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Mensagem…"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="min-h-11 shrink-0 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-bold text-[var(--color-on-accent)] disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
