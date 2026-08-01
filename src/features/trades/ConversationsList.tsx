import {
  getPublicProfile,
  subscribeToMyThreads,
  syncInboxPreviewFromThread,
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

    setLoading(true);
    setError(null);

    const unsub = subscribeToMyThreads(
      userId,
      (list) => {
        setThreads(list);
        setLoading(false);
        setError(null);

        const peerIds = list
          .map(
            (t) =>
              t.peerId ?? t.participantIds.find((id) => id !== userId),
          )
          .filter((id): id is string => Boolean(id));
        const unique = [...new Set(peerIds)];

        void Promise.all(
          unique.map(async (id) => {
            try {
              const profile = await getPublicProfile(id);
              return [id, profile?.displayName ?? "Treinador"] as const;
            } catch {
              return [id, "Treinador"] as const;
            }
          }),
        ).then((entries) => {
          setNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
        });

        // Repara preview apagado por ensureThread antigo
        for (const item of list) {
          if (item.lastMessagePreview) continue;
          void syncInboxPreviewFromThread(userId, item.id).then((fixed) => {
            if (!fixed?.lastMessagePreview) return;
            setThreads((prev) =>
              prev.map((t) =>
                t.id === item.id
                  ? {
                      ...t,
                      lastMessagePreview: fixed.lastMessagePreview,
                      lastSenderId: fixed.lastSenderId,
                      peerId: fixed.peerId ?? t.peerId,
                    }
                  : t,
              ),
            );
          });
        }
      },
      (err) => {
        console.warn("[Conversas]", err);
        const code =
          err && typeof err === "object" && "code" in err
            ? String((err as { code: unknown }).code)
            : "";
        setError(
          code === "permission-denied"
            ? "Sem permissão para listar conversas. Confira o deploy das rules."
            : "Não foi possível carregar conversas.",
        );
        setLoading(false);
      },
    );

    return unsub;
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
    <ul className="space-y-2.5">
      {threads.map((thread) => {
        const peerId =
          thread.peerId ??
          thread.participantIds.find((id) => id !== userId) ??
          "—";
        const name = names[peerId] ?? "Treinador";
        const preview = thread.lastMessagePreview ?? "Sem mensagens ainda";
        return (
          <li
            key={thread.id}
            className="rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3"
          >
            <div className="flex min-h-16 flex-col justify-center gap-1">
              {peerId !== "—" ? (
                <Link
                  to={`/u/${peerId}`}
                  className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-accent)] underline-offset-2 hover:underline"
                >
                  {name}
                </Link>
              ) : (
                <span className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-text)]">
                  {name}
                </span>
              )}
              <Link
                to={`/trades/chat/${thread.id}`}
                className="truncate text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                {preview}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
