export function ligaPokemonSearchUrl(cardName: string): string {
  const q = encodeURIComponent(cardName.trim());
  return `https://www.ligapokemon.com.br/?view=cards/search&card=${q}`;
}

export function mypCardsSearchUrl(cardName: string): string {
  const q = encodeURIComponent(cardName.trim());
  return `https://mypcards.com/pokemon?busca=${q}`;
}
