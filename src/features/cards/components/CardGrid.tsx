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
  onCardPress: (id: string) => void;
}

export function CardGrid({ cards, ownedIds, onCardPress }: CardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          id={card.id}
          name={card.name}
          localId={card.localId}
          image={card.image ?? null}
          rarity={card.rarity}
          isInCollection={ownedIds?.has(card.id)}
          onPress={onCardPress}
        />
      ))}
    </div>
  );
}
