// Event category labels and badges (EVT-01). Display only: no state, no RNG.
// Callers pass the effective category (effectiveCategory at draw time, or the category saved in the event result).
export const EVENT_CATEGORY_LABEL = Object.freeze({training:'トレーニング',encounter:'日常・交流',endorsement:'広報・スポンサー'});

export function eventCategoryBadge(category){
  if(!Object.hasOwn(EVENT_CATEGORY_LABEL,category))return '';
  return `<span class="event-badge event-badge-${category}">${EVENT_CATEGORY_LABEL[category]}</span>`;
}
