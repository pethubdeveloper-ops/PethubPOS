import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput, Platform, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Product, CATEGORIES } from '@/data/products';
import { CartSheet } from '@/components/CartSheet';
import { EditProductSheet } from '@/components/EditProductSheet';
import { ProductDetailSheet } from '@/components/ProductDetailSheet';
import { WAREHOUSE, PRESIDENT } from '@/data/seeds';

const CATEGORY_COLORS: Record<string, string> = {
  'Canine Test Kits': '#3b82f6',
  'Feline Test Kits': '#8b5cf6',
  'Canine Vaccines': '#f59e0b',
  'Feline Vaccines': '#f97316',
  'Parasiticides': '#10b981',
  'Pet Ideas Products': '#ec4899',
  'Anesthesia': '#6366f1',
  'Surgical Items': '#ef4444',
};

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onEdit: (p: Product) => void;
  onDetail: (p: Product) => void;
}

function ProductCard({ product, isAdmin, onEdit, onDetail }: ProductCardProps) {
  const colors = useColors();
  const { cart, addToCart, updateCartQty } = useApp();
  const cartItem = cart.find(i => i.product.id === product.id);
  const catColor = CATEGORY_COLORS[product.category] ?? colors.accent;
  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToCart(product);
  }, [product, addToCart]);

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDetail(product); }}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 }]}
    >
      {/* Product photo */}
      {product.photo ? (
        <Image source={{ uri: product.photo }} style={styles.cardPhoto} />
      ) : (
        <View style={[styles.cardPhotoPlaceholder, { backgroundColor: colors.muted }]}>
          <Feather name="package" size={22} color={colors.mutedForeground} />
        </View>
      )}

      {/* Category badge + edit button row */}
      <View style={styles.badgeRow}>
        <View style={[styles.catBadge, { backgroundColor: catColor + '18', flex: 1 }]}>
          <Text style={[styles.catText, { color: catColor }]} numberOfLines={1}>
            {product.category}
          </Text>
        </View>
        {isAdmin && (
          <Pressable
            onPress={() => onEdit(product)}
            hitSlop={8}
            style={[styles.editBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="edit-2" size={11} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={3}>
        {product.name}
      </Text>
      <Text style={[styles.cardSku, { color: colors.mutedForeground }]}>{product.sku}</Text>

      {/* Description (truncated) */}
      {product.desc ? (
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {product.desc}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        {isAdmin ? (
          <View style={styles.priceStack}>
            {product.price > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Cost</Text>
                <Text style={[styles.priceValue, { color: '#d97706' }]}>{fmt(product.price)}</Text>
              </View>
            )}
            {product.srp != null && product.srp > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>SRP</Text>
                <Text style={[styles.priceValue, { color: colors.primary }]}>{fmt(product.srp)}</Text>
              </View>
            )}
            {product.wholesale != null && product.wholesale > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>WS</Text>
                <Text style={[styles.priceValue, { color: '#3b82f6' }]}>{fmt(product.wholesale)}</Text>
              </View>
            )}
          </View>
        ) : (
          product.srp != null && product.srp > 0 ? (
            <Text style={[styles.cardPrice, { color: colors.foreground }]}>{fmt(product.srp)}</Text>
          ) : (
            <Text style={[styles.cardPrice, { color: '#d97706', fontSize: 11 }]}>Price not set</Text>
          )
        )}
        <View style={[styles.stockPill, {
          backgroundColor: product.stock === 0
            ? colors.destructive + '15'
            : product.stock < 10
            ? colors.warning + '15'
            : colors.accent + '15',
        }]}>
          <Text style={[styles.stockPillText, {
            color: product.stock === 0 ? colors.destructive
              : product.stock < 10 ? colors.warning
              : colors.accent,
          }]}>
            {product.stock === 0 ? 'Out' : `${product.stock}`}
          </Text>
        </View>
      </View>

      {/* Qty controls or add button */}
      {cartItem ? (
        <View style={[styles.qtyRow, { borderColor: colors.border }]}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateCartQty(product.id, cartItem.qty - 1); }}
            style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="minus" size={14} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.qtyNum, { color: colors.foreground }]}>{cartItem.qty}</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateCartQty(product.id, cartItem.qty + 1); }}
            style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="plus" size={14} color={colors.foreground} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={product.stock > 0 ? handleAdd : undefined}
          disabled={product.stock === 0}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: product.stock === 0
                ? colors.muted
                : pressed ? colors.primary + 'dd' : colors.primary,
            },
          ]}
        >
          <Feather name="plus" size={15} color={product.stock === 0 ? colors.mutedForeground : '#fff'} />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ expiry?: string }>();
  const { products, cart, userBranch } = useApp();
  const isWarehouse = userBranch === WAREHOUSE;
  const isAdmin = isWarehouse || userBranch === PRESIDENT;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartVisible, setCartVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [expiryFilter, setExpiryFilterLocal] = useState<'near' | 'expired' | null>(null);

  // Sync expiry filter from navigation param (from dashboard tap)
  useEffect(() => {
    if (params.expiry === 'near') setExpiryFilterLocal('near');
    else if (params.expiry === 'expired') setExpiryFilterLocal('expired');
    else setExpiryFilterLocal(null);
  }, [params.expiry]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in90 = new Date(today);
    in90.setDate(today.getDate() + 90);

    let list = products;

    if (expiryFilter === 'near') {
      list = list.filter(p => {
        const sources = p.batches?.length
          ? p.batches
          : p.expiryDate ? [{ expiryDate: p.expiryDate, stock: p.stock }] : [];
        return sources.some(b => {
          if (!b.expiryDate || b.stock === 0) return false;
          const exp = new Date(b.expiryDate);
          if (isNaN(exp.getTime())) return false;  // label like "Old Stock" — not near expiry
          return exp >= today && exp <= in90;
        });
      });
    } else if (expiryFilter === 'expired') {
      list = list.filter(p => {
        const sources = p.batches?.length
          ? p.batches
          : p.expiryDate ? [{ expiryDate: p.expiryDate, stock: p.stock }] : [];
        return sources.some(b => {
          if (!b.expiryDate || b.stock === 0) return false;
          const exp = new Date(b.expiryDate);
          if (isNaN(exp.getTime())) return false;  // label like "Old Stock" — not expired
          return exp < today;
        });
      });
    } else {
      if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
    }
    return list;
  }, [products, activeCategory, search, expiryFilter]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      isAdmin={isAdmin}
      onEdit={setEditingProduct}
      onDetail={setDetailProduct}
    />
  ), [isAdmin]);

  const listHeader = (
    <View>
      {/* Expiry filter banner */}
      {expiryFilter && (
        <View style={[styles.expiryBanner, {
          backgroundColor: expiryFilter === 'expired' ? colors.destructive + '15' : colors.warning + '15',
          borderColor: expiryFilter === 'expired' ? colors.destructive + '40' : colors.warning + '40',
        }]}>
          <Feather
            name={expiryFilter === 'expired' ? 'alert-octagon' : 'clock'}
            size={14}
            color={expiryFilter === 'expired' ? colors.destructive : colors.warning}
          />
          <Text style={[styles.expiryBannerText, { color: expiryFilter === 'expired' ? colors.destructive : colors.warning, flex: 1 }]}>
            Showing {expiryFilter === 'expired' ? 'expired' : 'near-expiring'} products
          </Text>
          <Pressable onPress={() => { setExpiryFilterLocal(null); router.setParams({ expiry: undefined }); }} hitSlop={8}>
            <Feather name="x" size={14} color={expiryFilter === 'expired' ? colors.destructive : colors.warning} />
          </Pressable>
        </View>
      )}

      {/* Search bar (hidden when expiry filter active) */}
      {!expiryFilter && (
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products or SKU…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      )}

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
        renderItem={({ item: cat }) => (
          <Pressable
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.chip,
              {
                backgroundColor: activeCategory === cat ? colors.primary : colors.card,
                borderColor: activeCategory === cat ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: activeCategory === cat ? '#fff' : colors.mutedForeground }]}>
              {cat}
            </Text>
          </Pressable>
        )}
      />

      <View style={styles.countRow}>
        <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </Text>
        {isWarehouse && (
          <View style={[styles.warehouseBadge, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="edit-2" size={11} color={colors.primary} />
            <Text style={[styles.warehouseBadgeText, { color: colors.primary }]}>
              Tap ✏ on any card to edit
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Products</Text>
        <Pressable onPress={() => setCartVisible(true)} style={styles.cartBtn}>
          <Feather name="shopping-cart" size={22} color="#fff" />
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => String(p.id)}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={36} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No products found</Text>
          </View>
        }
      />

      <CartSheet visible={cartVisible} onClose={() => setCartVisible(false)} />

      <EditProductSheet
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
      />

      <ProductDetailSheet
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  cartBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  countLabel: { fontSize: 12, fontWeight: '500' },
  warehouseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  warehouseBadgeText: { fontSize: 11, fontWeight: '600' },
  expiryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8, marginTop: 4,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  expiryBannerText: { fontSize: 13, fontWeight: '600' },
  row: { paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  card: {
    flex: 1, borderRadius: 14, padding: 12, gap: 6,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPhoto: { width: '100%', height: 80, borderRadius: 8, resizeMode: 'cover' },
  cardPhotoPlaceholder: {
    width: '100%', height: 60, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catText: { fontSize: 10, fontWeight: '700' },
  editBtn: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
  cardSku: { fontSize: 11 },
  cardDesc: { fontSize: 11, lineHeight: 15 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  cardPrice:  { fontSize: 13, fontWeight: '700' },
  priceStack: { gap: 2, marginBottom: 2 },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, width: 22 },
  priceValue: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stockPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  stockPillText: { fontSize: 11, fontWeight: '700' },
  addBtn: { marginTop: 4, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, paddingTop: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15 },
});
