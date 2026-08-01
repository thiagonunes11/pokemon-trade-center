import { CardItem } from "./CardItem";

type GridCard = {
  id: string;
  name: string;
  localId: string;
  image?: string | null;
  rarity?: string;
};

interface CardGridProps {
  cards: GridCard[];
  ownedIds?: Set<string>;
  binderMode?: boolean;
  onCardPress: (id: string) => void;
}

export function CardGrid({
  cards,
  ownedIds,
  binderMode = false,
  onCardPress,
}: CardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="motion-safe:animate-[fadeIn_0.35s_ease-out_both]"
          style={{ animationDelay: `${Math.min(index, 24) * 40}ms` }}
        >
          <CardItem
            id={card.id}
            name={card.name}
            localId={card.localId}
            image={card.image ?? null}
            rarity={card.rarity}
            isInCollection={ownedIds?.has(card.id)}
            binderMode={binderMode}
            onPress={onCardPress}
          />
        </div>
      ))}
    </div>
  );
}
