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
import { Link, useParams } from "react-router-dom";

export function TradeChatPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const userId = useAuthStore((s) => s.userId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerName, setPeerName] = useState("Treinador");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId || !userId) return;
    let cancelled = false;
    void getThread(threadId).then((thread) => {
      if (cancelled || !thread) return;
      const other = thread.participantIds.find((id) => id !== userId);
      if (!other) return;
      setPeerId(other);
      void getPublicProfile(other).then((p) => {
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
      <p className="text-sm text-[var(--color-text-secondary)]">
        Conversa inválida.
      </p>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-lg flex-col md:h-[calc(100dvh-3rem)]">
      <header className="mb-4 space-y-1">
        <div className="flex items-center gap-3">
          <BackButton to="/trades">Trocas</BackButton>
          <h1 className="min-w-0 flex-1 truncate font-[family-name:var(--font-display)] text-xl font-extrabold text-[var(--color-text)]">
            {peerId ? (
              <Link
                to={`/u/${peerId}`}
                className="text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                {peerName}
              </Link>
            ) : (
              peerName
            )}
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Combine a troca aqui. Grupos da cidade: aba Comunidade (WhatsApp).
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-[var(--color-text-secondary)]">
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
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug font-medium ${
                      mine
                        ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                        : "border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-sm"
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
          <p className="px-4 pb-1 text-sm font-medium text-[var(--color-error)]">
            {error}
          </p>
        ) : null}

        <form
          className="flex gap-2 border-t-2 border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Escreva uma mensagem…"
            className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="min-h-12 shrink-0 rounded-xl bg-[var(--color-accent)] px-5 text-sm font-extrabold text-[var(--color-on-accent)] disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
