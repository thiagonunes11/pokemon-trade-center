import {
  fetchMyThreads,
  getPublicProfile,
  type ChatThread,
} from "@/features/trades/threadsService";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function ConversationsList() {
  const userId = useAuthStore((s) => s.userId);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMyThreads(userId);
        if (cancelled) return;
        setThreads(list);
        const peerIds = list
          .map((t) => t.participantIds.find((id) => id !== userId))
          .filter((id): id is string => Boolean(id));
        const unique = [...new Set(peerIds)];
        const entries = await Promise.all(
          unique.map(async (id) => {
            const profile = await getPublicProfile(id);
            return [id, profile?.displayName ?? "Treinador"] as const;
          }),
        );
        if (!cancelled) {
          setNames(Object.fromEntries(entries));
        }
      } catch (err) {
        console.warn("[Conversas]", err);
        if (!cancelled) setError("Não foi possível carregar conversas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Carregando…</p>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--color-error)]">{error}</p>;
  }

  if (threads.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
        Nenhuma conversa ainda. No mural, toque em Conversar em um anúncio.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {threads.map((thread) => {
        const peerId =
          thread.participantIds.find((id) => id !== userId) ?? "—";
        const name = names[peerId] ?? "Treinador";
        return (
          <li key={thread.id}>
            <Link
              to={`/trades/chat/${thread.id}`}
              className="flex min-h-14 flex-col justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 hover:border-[var(--color-accent)]"
            >
              <span className="font-semibold text-[var(--color-text)]">
                {name}
              </span>
              <span className="truncate text-xs text-[var(--color-text-muted)]">
                {thread.lastMessagePreview ?? "Sem mensagens ainda"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
