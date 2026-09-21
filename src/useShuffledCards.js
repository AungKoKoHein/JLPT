import { useMemo } from "react";

// Keep the randomized order stable while cards are flipped or display settings change.
export default function useShuffledCards(cards, enabled, getId = (card) => card._id) {
  const ids = JSON.stringify(cards.map(getId));
  const order = useMemo(() => {
    const shuffled = JSON.parse(ids);
    if (enabled) {
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    return new Map(shuffled.map((id, index) => [id, index]));
  }, [ids, enabled]);
  return enabled ? [...cards].sort((a, b) => order.get(getId(a)) - order.get(getId(b))) : cards;
}
