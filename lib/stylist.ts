import { Product as DbProduct, Variant } from '@prisma/client';
type StockProduct = DbProduct & { variants: Variant[] };
export function catalogAdvice(message: string, products: StockProduct[]) {
  const text = message.toLowerCase();
  const budgetMatch = text.match(/(?:до|бюджет(?:ом)?\s*(?:до|в)?|не\s+дороже)\s*([\d\s.,]+)\s*(тыс(?:яч)?|тысяч|млн|миллион)?/);
  let budget = Infinity;
  if (budgetMatch) {
    budget = Number(budgetMatch[1].replace(/\s/g, '').replace(',', '.'));
    if (budgetMatch[2]?.startsWith('тыс')) budget *= 1000;
    if (budgetMatch[2]?.startsWith('мл')) budget *= 1000000;
    if (!Number.isFinite(budget) || budget <= 0) budget = Infinity;
  }
  const care = /уход|стират|стирк|состав|материал/.test(text);
  const targeted = products.filter(p => p.variants.some(v => v.stock > 0) && (
    text.includes(p.slug.replaceAll('-', ' ')) || p.title.toLowerCase().split(' ').some(word => word.length > 3 && text.includes(word))
  ));
  const stock = products.filter(p => p.variants.some(v => v.stock > 0));
  const preference = /худи|тепл|прохлад/.test(text) ? ['Худи','Джинсы','Аксессуары'] : /плать|свидан/.test(text) ? ['Платья','Куртки','Аксессуары'] : ['Футболки','Брюки','Аксессуары'];
  let remaining = budget;
  const selected: StockProduct[] = [];
  for (const p of [...targeted, ...preference.flatMap(category => stock.filter(p => p.category === category).sort((a,b)=>a.priceUzs-b.priceUzs))]) {
    if (selected.length >= 3) break;
    if (!selected.some(s => s.id === p.id || (!care && s.category === p.category)) && p.priceUzs <= remaining) { selected.push(p); remaining -= p.priceUzs; }
  }
  const advice = care && selected.length
    ? selected.map(p => `${p.title}: ${p.material}. ${p.care}`).join('\n\n')
    : !selected.length ? 'В наличии нет подходящей подборки под этот бюджет. Попробуй увеличить сумму или изменить запрос.'
    : /сочета|цвет|голуб/.test(text) ? 'Для спокойного повседневного сочетания попробуй светлый верх, синий деним или бежевые брюки. Цвет и размер выбирай в карточке товара.'
    : 'Начни с удобной базы и добавь аксессуар. Ниже — подборка из доступных товаров' + (Number.isFinite(budget) ? ' в пределах общего бюджета.' : '. Укажи бюджет, чтобы сузить выбор.');
  return {text: advice + '\n\nРазмер сверяй с таблицей и своими мерками.', productIds: selected.map(p=>p.id), mode: 'catalog' as const};
}
