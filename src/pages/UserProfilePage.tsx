import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/UserAvatar";
import { CardItem } from "@/features/cards";
import {
  fetchListingsByOwner,
  fetchPublicShowcase,
  fetchPublicUserProfile,
  type PublicShowcaseCard,
  type PublicUserProfile,
} from "@/features/profile";
import type { PublicListing } from "@/features/trades/listingsQuery";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const cardGridClass =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

function ProfileCardGrid({
  cards,
  emptyLabel,
  onPress,
}: {
  cards: Array<{ id: string; name: string; imageUrl: string | null }>;
  emptyLabel: string;
  onPress: (id: string) => void;
}) {
  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-center text-sm text-[var(--color-text-muted)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cardGridClass}>
      {cards.map((card) => (
        <CardItem
          key={card.id}
          id={card.id}
          name={card.name}
          localId={card.id.split("-").pop() ?? ""}
          image={card.imageUrl}
          compact
          onPress={onPress}
        />
      ))}
    </div>
  );
}

export function UserProfilePage() {
  const { uid = "" } = useParams();
  const navigate = useNavigate();
  const myId = useAuthStore((s) => s.userId);
  const isSelf = Boolean(myId && uid && myId === uid);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [showcase, setShowcase] = useState<PublicShowcaseCard[]>([]);
  const [offering, setOffering] = useState<PublicListing[]>([]);
  const [wanted, setWanted] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchPublicUserProfile(uid),
      fetchPublicShowcase(uid),
      fetchListingsByOwner(uid, "offering"),
      fetchListingsByOwner(uid, "wanted"),
    ])
      .then(([p, show, off, want]) => {
        if (cancelled) return;
        setProfile(p);
        setShowcase(show);
        setOffering(off);
        setWanted(want);
      })
      .catch((err) => {
        console.warn("[Profile]", err);
        if (!cancelled) {
          setError(
            "Não foi possível carregar este perfil. Verifique as regras Firestore e os índices.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const copyLink = async () => {
    const url = `${window.location.origin}/u/${uid}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!uid) {
    return (
      <p className="text-sm text-[var(--color-error)]">Perfil inválido.</p>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <BackButton to="/trades">Voltar</BackButton>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Carregando perfil…
        </p>
      ) : error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : (
        <>
          <header className="flex items-start gap-4">
            <UserAvatar
              userId={uid}
              name={profile?.displayName}
              size={64}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-text)] sm:text-3xl">
                  {profile?.displayName ?? "Treinador"}
                </h1>
                {isSelf ? (
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Seu perfil
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {profile?.cityName
                  ? profile.cityName
                  : "Cidade não informada"}
              </p>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="mt-2 min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 text-sm font-semibold text-[var(--color-text)]"
              >
                {copied ? "Link copiado" : "Copiar link do perfil"}
              </button>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
              Vitrine
            </h2>
            <ProfileCardGrid
              cards={showcase}
              emptyLabel="Nenhuma carta na vitrine."
              onPress={(id) => navigate(`/card/${id}`)}
            />
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
              Anunciando
            </h2>
            <ProfileCardGrid
              cards={offering.map((l) => ({
                id: l.cardId,
                name: l.name,
                imageUrl: l.imageUrl,
              }))}
              emptyLabel="Nenhuma carta anunciada."
              onPress={(id) => navigate(`/card/${id}`)}
            />
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-text)]">
              Procurando
            </h2>
            <ProfileCardGrid
              cards={wanted.map((l) => ({
                id: l.cardId,
                name: l.name,
                imageUrl: l.imageUrl,
              }))}
              emptyLabel="Nenhuma carta na lista de procura."
              onPress={(id) => navigate(`/card/${id}`)}
            />
          </section>
        </>
      )}
    </div>
  );
}
