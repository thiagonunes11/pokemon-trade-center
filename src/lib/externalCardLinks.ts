export function ligaPokemonSearchUrl(cardName: string): string {
  const q = encodeURIComponent(cardName.trim());
  return `https://www.ligapokemon.com.br/?view=cards/search&card=${q}`;
}

export function mypCardsSearchUrl(cardName: string): string {
  const q = encodeURIComponent(cardName.trim().toLocaleLowerCase("pt-BR"));
  return `https://mypcards.com/pokemon?ProdutoSearch%5Bmarca%5D=pokemon&ProdutoSearch%5Bquery%5D=${q}`;
}
