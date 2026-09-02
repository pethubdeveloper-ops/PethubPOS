import React from 'react';
import {
  Modal, View, Text, ScrollView, Pressable, Image, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Product, Batch } from '@/data/products';
import { WAREHOUSE } from '@/data/seeds';

interface Props {
  product: Product | null;
  onClose: () => void;
}

const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
const IN90  = (() => { const d = new Date(TODAY); d.setDate(d.getDate() + 90); return d; })();

function batchStatus(b: Batch): 'expired' | 'near' | 'ok' | null {
  if (!b.expiryDate) return null;
  const exp = new Date(b.expiryDate);
  if (isNaN(exp.getTime())) return null;  // non-date label like "Old Stock"
  return exp < TODAY ? 'expired' : exp <= IN90 ? 'near' : 'ok';
}

function fmtDate(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;  // return label as-is (e.g. "Old Stock")
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ProductDetailSheet({ product, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart, cart, userBranch } = useApp();

  if (!product) return null;

  const cartItem = cart.find(i => i.product.id === product.id);
  const isWarehouse = userBranch === WAREHOUSE;
  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  // Resolve batches (fall back to legacy expiryDate)
  const batches: Batch[] = product.batches?.length
    ? product.batches
    : product.expiryDate
      ? [{ id: 'B001', expiryDate: product.expiryDate, price: product.price, stock: product.stock }]
      : [];
  const hasBatches = batches.length > 0;

  // Worst-case status across all batches
  let worstStatus: 'expired' | 'near' | 'ok' | null = null;
  batches.forEach(b => {
    const s = batchStatus(b);
    if (s === 'expired') worstStatus = 'expired';
    else if (s === 'near' && worstStatus !== 'expired') worstStatus = 'near';
    else if (s === 'ok' && !worstStatus) worstStatus = 'ok';
  });

  const stockColor = product.stock === 0 ? colors.destructive
    : product.stock < 10 ? colors.warning : colors.accent;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Close button */}
        <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]} hitSlop={10}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Photo */}
          {product.photo ? (
            <Image source={{ uri: product.photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="package" size={56} color={colors.mutedForeground} />
              <Text style={[styles.photoPlaceholderText, { color: colors.mutedForeground }]}>No photo</Text>
            </View>
          )}

          <View style={styles.body}>
            {/* Category tag */}
            <Text style={[styles.categoryTag, { color: colors.primary }]}>{product.category}</Text>

            {/* Product name */}
            <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>

            {/* SKU · unit */}
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{product.sku}  ·  {product.unit}</Text>

            {/* Worst-case expiry banner */}
            {worstStatus && worstStatus !== 'ok' && (
              <View style={[
                styles.expiryBanner,
                {
                  backgroundColor: worstStatus === 'expired' ? colors.destructive + '15' : colors.warning + '15',
                  borderColor: worstStatus === 'expired' ? colors.destructive + '50' : colors.warning + '50',
                },
              ]}>
                <Feather
                  name={worstStatus === 'expired' ? 'alert-octagon' : 'clock'}
                  size={15}
                  color={worstStatus === 'expired' ? colors.destructive : colors.warning}
                />
                <Text style={[styles.expiryText, { color: worstStatus === 'expired' ? colors.destructive : colors.warning }]}>
                  {worstStatus === 'expired'
                    ? 'Has expired batch(es) — check inventory'
                    : 'Has batch(es) expiring within 90 days'}
                </Text>
              </View>
            )}

            {/* Total stock summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Stock</Text>
                <Text style={[styles.summaryValue, { color: stockColor }]}>
                  {product.stock === 0 ? 'Out of stock' : `${product.stock} units`}
                </Text>
              </View>
              {!hasBatches && product.price > 0 && (
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Unit Price</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{fmt(product.price)}</Text>
                </View>
              )}
            </View>

            {/* Batches section */}
            {hasBatches && (
              <View style={styles.batchSection}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  BATCHES ({batches.length})
                </Text>

                <View style={[styles.batchCard, { borderColor: colors.border }]}>
                  {/* Header row */}
                  <View style={[styles.batchHeader, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.batchHeaderCell, { color: colors.mutedForeground, flex: 1.5 }]}>BATCH</Text>
                    <Text style={[styles.batchHeaderCell, { color: colors.mutedForeground, textAlign: 'right' }]}>PRICE</Text>
                    <Text style={[styles.batchHeaderCell, { color: colors.mutedForeground, textAlign: 'right' }]}>STK</Text>
                    <Text style={[styles.batchHeaderCell, { color: colors.mutedForeground, textAlign: 'right', flex: 1.8 }]}>EXPIRY</Text>
                  </View>

                  {batches.map((b, i) => {
                    const st = batchStatus(b);
                    const expiryColor =
                      st === 'expired' ? colors.destructive :
                      st === 'near'    ? colors.warning :
                                         colors.mutedForeground;
                    const rowBg =
                      st === 'expired' ? colors.destructive + '0D' :
                      st === 'near'    ? colors.warning + '0D' :
                                         colors.card;
                    return (
                      <View
                        key={b.id}
                        style={[
                          styles.batchRow,
                          {
                            borderTopWidth: i === 0 ? 0 : 1,
                            borderTopColor: colors.border,
                            backgroundColor: rowBg,
                          },
                        ]}
                      >
                        {/* Batch ID + received */}
                        <View style={{ flex: 1.5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {st === 'expired' && <Feather name="alert-octagon" size={10} color={colors.destructive} />}
                            {st === 'near'    && <Feather name="clock" size={10} color={colors.warning} />}
                            <Text style={[styles.batchId, { color: colors.foreground }]}>{b.id}</Text>
                          </View>
                          {b.receivedDate && (
                            <Text style={[styles.batchMeta, { color: colors.mutedForeground }]}>
                              {fmtDate(b.receivedDate)}
                            </Text>
                          )}
                        </View>
                        {/* Price */}
                        <Text style={[styles.batchCell, { color: colors.primary, textAlign: 'right' }]}>
                          {b.price > 0 ? fmt(b.price) : '—'}
                        </Text>
                        {/* Stock */}
                        <Text style={[styles.batchCell, {
                          textAlign: 'right',
                          color: b.stock === 0 ? colors.destructive : b.stock < 5 ? colors.warning : colors.accent,
                        }]}>
                          {b.stock}
                        </Text>
                        {/* Expiry */}
                        <Text style={[styles.batchExpiry, { color: expiryColor, flex: 1.8, textAlign: 'right' }]}>
                          {b.expiryDate ? fmtDate(b.expiryDate) : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Description */}
            {product.desc ? (
              <View style={styles.descSection}>
                <Text style={[styles.descLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
                <Text style={[styles.descText, { color: colors.foreground }]}>{product.desc}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Footer CTA */}
        {!isWarehouse && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {cartItem ? (
              <View style={[styles.inCartPill, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                <Feather name="check-circle" size={16} color={colors.accent} />
                <Text style={[styles.inCartText, { color: colors.accent }]}>
                  {cartItem.qty}× already in your order
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  if (product.stock === 0) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  addToCart(product);
                  onClose();
                }}
                disabled={product.stock === 0}
                style={({ pressed }) => [
                  styles.addBtn,
                  {
                    backgroundColor: product.stock === 0 ? colors.muted
                      : pressed ? colors.primary + 'dd' : colors.primary,
                  },
                ]}
              >
                <Feather name="shopping-cart" size={18} color={product.stock === 0 ? colors.mutedForeground : '#fff'} />
                <Text style={[styles.addBtnText, { color: product.stock === 0 ? colors.mutedForeground : '#fff' }]}>
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Order'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handleRow: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeBtn: {
    position: 'absolute', top: 12, right: 16, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  photo: { width: '100%', height: 220, resizeMode: 'cover' },
  photoPlaceholder: {
    width: '100%', height: 180,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  photoPlaceholderText: { fontSize: 13, fontWeight: '500' },
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 12 },
  categoryTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  productName: { fontSize: 21, fontWeight: '800', lineHeight: 27 },
  meta: { fontSize: 12, fontWeight: '500' },
  expiryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  expiryText: { fontSize: 13, fontWeight: '600', flex: 1 },
  summaryCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  summaryLabel: { fontSize: 13, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  batchSection: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  batchCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  batchHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  batchHeaderCell: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6, flex: 1 },
  batchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  batchId: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  batchMeta: { fontSize: 10, marginTop: 1 },
  batchCell: { fontSize: 12, fontWeight: '700', flex: 1, fontVariant: ['tabular-nums'] },
  batchExpiry: { fontSize: 11, fontWeight: '600' },
  descSection: { gap: 6 },
  descLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  descText: { fontSize: 14, lineHeight: 21 },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  inCartPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1, justifyContent: 'center',
  },
  inCartText: { fontSize: 15, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, justifyContent: 'center' },
  addBtnText: { fontSize: 16, fontWeight: '700' },
});
