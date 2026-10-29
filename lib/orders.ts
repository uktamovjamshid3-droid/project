import { createHash } from 'node:crypto';
import { db } from './db';
import { delivery } from './catalog';
export type Checkout = {
  contactName: string; phone: string; address: string; comment: string;
  checkoutKey?: string; items: { variantId: string; quantity: number }[];
};
export async function placeOrder(input: Checkout, userId?: string) {
  const combined = new Map<string, number>();
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error('Не более 20 единиц одного варианта.');
    combined.set(item.variantId, (combined.get(item.variantId) || 0) + item.quantity);
  }
  if (!combined.size) throw new Error('Товар больше недоступен. Обновите корзину.');
  const requestHash = createHash('sha256').update(JSON.stringify({
    userId: userId || null, contactName: input.contactName, phone: input.phone,
    address: input.address, comment: input.comment,
    items: [...combined.entries()].sort(([a], [b]) => a.localeCompare(b)),
  })).digest('hex');
  return db.$transaction(async tx => {
    if (input.checkoutKey) {
      const existing = await tx.order.findUnique({ where: { checkoutKey: input.checkoutKey }, include: { items: { include: { variant: true } } } });
      if (existing) {
        if (existing.requestHash !== requestHash || existing.userId !== (userId || null)) throw new Error('Заказ с этим запросом уже оформлен. Проверьте историю заказов.');
        return existing;
      }
    }
    let subtotal = 0;
    const items = [];
    for (const [variantId, quantity] of combined) {
      if (quantity > 20) throw new Error('Не более 20 единиц одного варианта.');
      const variant = await tx.variant.findUnique({ where: { id: variantId }, include: { product: true } });
      if (!variant || !variant.product.active) throw new Error('Товар больше недоступен. Обновите корзину.');
      const changed = await tx.variant.updateMany({ where: { id: variantId, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
      if (changed.count !== 1) throw new Error(`Недостаточно товара «${variant.product.title}», ${variant.size}, ${variant.color}.`);
      subtotal += variant.product.priceUzs * quantity;
      items.push({ variantId, quantity, titleSnapshot: variant.product.title, unitPriceUzs: variant.product.priceUzs });
    }
    const fee = delivery(subtotal);
    const order = await tx.order.create({
      data: { contactName: input.contactName, phone: input.phone, address: input.address, comment: input.comment, userId,
        checkoutKey: input.checkoutKey, requestHash, subtotalUzs: subtotal, deliveryUzs: fee, totalUzs: subtotal + fee, items: { create: items } },
      include: { items: { include: { variant: true } } },
    });
    if (userId) await tx.cartItem.deleteMany({ where: { userId } });
    return order;
  });
}
