import { BackButton } from "@/components/BackButton";
import { UserAvatar } from "@/components/UserAvatar";
import { CardItem } from "@/features/cards";
import {
  fetchListingsByOwner,
  fetchPublicShowcase,
  fetchPublicUserProfile,
  profileLoadErrorMessage,
  resolveUidFromProfileParam,
  type PublicShowcaseCard,
  type PublicUserProfile,
} from "@/features/profile";
import type { PublicListing } from "@/features/trades/listingsQuery";
import { profilePathFor } from "@/lib/handle";
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
  const { uid: profileParam = "" } = useParams();
  const navigate = useNavigate();
  const myId = useAuthStore((s) => s.userId);

  const [resolvedUid, setResolvedUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [showcase, setShowcase] = useState<PublicShowcaseCard[]>([]);
  const [offering, setOffering] = useState<PublicListing[]>([]);
  const [wanted, setWanted] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionWarning, setSectionWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isSelf = Boolean(myId && resolvedUid && myId === resolvedUid);

  useEffect(() => {
    if (!profileParam) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSectionWarning(null);
    setResolvedUid(null);

    void (async () => {
      try {
        const uid = await resolveUidFromProfileParam(profileParam);
        if (cancelled) return;
        if (!uid) {
          setError("Perfil não encontrado.");
          setLoading(false);
          return;
        }
        setResolvedUid(uid);

        const p = await fetchPublicUserProfile(uid);
        if (cancelled) return;
        setProfile(p);

        // Canonical URL when handle exists
        if (p.handle && profileParam !== p.handle) {
          navigate(profilePathFor(p.handle), { replace: true });
        }

        const results = await Promise.allSettled([
          fetchPublicShowcase(uid),
          fetchListingsByOwner(uid, "offering"),
          fetchListingsByOwner(uid, "wanted"),
        ]);
        if (cancelled) return;

        const [showRes, offRes, wantRes] = results;
        const warnings: string[] = [];

        if (showRes.status === "fulfilled") {
          setShowcase(showRes.value);
        } else {
          setShowcase([]);
          warnings.push(profileLoadErrorMessage(showRes.reason));
        }

        if (offRes.status === "fulfilled") {
          setOffering(offRes.value);
        } else {
          setOffering([]);
          warnings.push(profileLoadErrorMessage(offRes.reason));
        }

        if (wantRes.status === "fulfilled") {
          setWanted(wantRes.value);
        } else {
          setWanted([]);
          warnings.push(profileLoadErrorMessage(wantRes.reason));
        }

        if (warnings.length > 0) {
          setSectionWarning(warnings[0] ?? null);
        }
      } catch (err) {
        console.warn("[Profile]", err);
        if (!cancelled) {
          setError(profileLoadErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileParam, navigate]);

  const copyLink = async () => {
    const slug = profile?.handle ?? resolvedUid;
    if (!slug) return;
    const url = `${window.location.origin}${profilePathFor(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!profileParam) {
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
      ) : resolvedUid ? (
        <>
          <header className="flex items-start gap-4">
            <UserAvatar
              userId={resolvedUid}
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
              {profile?.handle ? (
                <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-accent)]">
                  @{profile.handle}
                </p>
              ) : null}
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

          {sectionWarning ? (
            <p className="rounded-xl border border-[var(--color-error)]/40 bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-error)]">
              {sectionWarning}
            </p>
          ) : null}

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
      ) : null}
    </div>
  );
}
