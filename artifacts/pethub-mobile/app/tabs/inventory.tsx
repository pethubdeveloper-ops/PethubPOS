import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { getBranchStock } from '@/data/seeds';

export default function InventoryScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { products, userBranch, branchNames, isPrivileged } = useApp();
  const { expiry: expiryParam } = useLocalSearchParams<{ expiry?: string }>();
  const [expiryFilter, setExpiryFilter] = useState<'near' | 'expired' | null>(
    expiryParam === 'near' || expiryParam === 'expired' ? expiryParam : null,
  );

  const isAllowed = isPrivileged;

  // For branch accounts — show their own branch inventory
  const defaultBranch = !isAllowed && userBranch ? userBranch : (branchNames[0] ?? '');
  const [selected, setSelected] = useState(defaultBranch);
  const [showPicker, setShowPicker] = useState(false);

  const branchIndex = branchNames.indexOf(selected);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in90  = new Date(today); in90.setDate(in90.getDate() + 90);

  const inventory = useMemo(() => {
    return products.map(p => {
      const stock = isAllowed
        ? getBranchStock(branchIndex, p.id, p.stock)
        : getBranchStock(branchNames.indexOf(userBranch ?? ''), p.id, p.stock);
      const batches: any[] = (p as any).batches ?? [];
      let hasExpired = false, hasNear = false;
      let latestExpiredDate: Date | null = null;  // most recently expired batch
      let soonestNearDate: Date | null = null;    // soonest upcoming batch within 90 days
      for (const b of batches) {
        if (!b.expiresAt) continue;
        const d = new Date(b.expiresAt);
        if (d < today) {
          hasExpired = true;
          if (!latestExpiredDate || d > latestExpiredDate) latestExpiredDate = d;
        } else if (d <= in90) {
          hasNear = true;
          if (!soonestNearDate || d < soonestNearDate) soonestNearDate = d;
        }
      }
      return { ...p, branchStock: stock, hasExpired, hasNear, latestExpiredDate, soonestNearDate };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, branchIndex, userBranch, isAllowed, branchNames]);

  const filtered = useMemo(() => {
    if (!expiryFilter) return inventory;
    return inventory.filter(i => {
      if (i.branchStock === 0) return false;
      if (expiryFilter === 'expired') return i.hasExpired;
      if (expiryFilter === 'near')    return i.hasNear && !i.hasExpired;
      return true;
    });
  }, [inventory, expiryFilter]);

  const displayList = expiryFilter ? filtered : inventory;

  const outOf  = displayList.filter(i => i.branchStock === 0).length;
  const lowOf  = displayList.filter(i => i.branchStock > 0 && i.branchStock < 10).length;
  const goodOf = displayList.filter(i => i.branchStock >= 10).length;

  const getStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', bg: colors.destructive + '18', text: colors.destructive };
    if (stock < 10)  return { label: 'Low Stock',    bg: '#f59e0b18',               text: '#f59e0b' };
    return                  { label: 'In Stock',     bg: colors.accent + '18',       text: colors.accent };
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderItem = ({ item }: { item: typeof inventory[0] }) => {
    const st = getStatus(item.branchStock);
    const showExpiry = !!expiryFilter && (item.hasExpired || item.hasNear);
    const expiryColor = item.hasExpired ? '#dc2626' : '#d97706';
    const expiryLabel = item.hasExpired ? 'Expired' : 'Expiring Soon';
    const expiryBg    = item.hasExpired ? '#fef2f2' : '#fff7ed';
    // Use the date that matches the displayed badge
    const expiryDate  = item.hasExpired ? item.latestExpiredDate : item.soonestNearDate;
    return (
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowLeft}>
          <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.productSub, { color: colors.mutedForeground }]}>
            {item.category} · {item.unit}
          </Text>
          {showExpiry && (
            <View style={[styles.expiryRow, { backgroundColor: expiryBg }]}>
              <Feather name={item.hasExpired ? 'alert-octagon' : 'clock'} size={10} color={expiryColor} />
              <Text style={[styles.expiryLabel, { color: expiryColor }]}>{expiryLabel}</Text>
              {expiryDate && (
                <Text style={[styles.expiryDate, { color: expiryColor }]}>
                  · {fmtDate(expiryDate as Date)}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.priceText, { color: colors.mutedForeground }]}>
            {isAllowed
              ? `₱${(item.price ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : (item.srp != null && item.srp > 0
                  ? `₱${item.srp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                  : 'Price not set')}
          </Text>
          <Text style={[styles.stockNum, { color: colors.foreground }]}>{item.branchStock}</Text>
          <View style={[styles.chip, { backgroundColor: st.bg }]}>
            <Text style={[styles.chipText, { color: st.text }]}>{st.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  const displayBranch = isAllowed ? selected : (userBranch ?? '');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Branch Inventory</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {displayBranch}
          </Text>
        </View>

        {/* Branch picker button — only for Warehouse/President */}
        {isAllowed && (
          <TouchableOpacity
            style={[styles.pickerBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
            onPress={() => setShowPicker(v => !v)}
          >
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.pickerBtnText, { color: colors.primary }]}>Switch</Text>
            <Feather name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Branch picker dropdown */}
      {showPicker && (
        <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {branchNames.map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.pickerItem, b === selected && { backgroundColor: colors.primary + '12' }]}
              onPress={() => { setSelected(b); setShowPicker(false); }}
            >
              <Feather
                name="map-pin"
                size={13}
                color={b === selected ? colors.primary : colors.mutedForeground}
              />
              <Text style={[
                styles.pickerItemText,
                { color: b === selected ? colors.primary : colors.foreground },
                b === selected && { fontWeight: '700' },
              ]} numberOfLines={1}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Summary chips */}
      <View style={[styles.summary, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Feather name="check-circle" size={14} color={colors.accent} />
          <Text style={[styles.summaryCount, { color: colors.accent }]}>{goodOf}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>In Stock</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Feather name="alert-triangle" size={14} color="#f59e0b" />
          <Text style={[styles.summaryCount, { color: '#f59e0b' }]}>{lowOf}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Low Stock</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Feather name="x-circle" size={14} color={colors.destructive} />
          <Text style={[styles.summaryCount, { color: colors.destructive }]}>{outOf}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Out of Stock</Text>
        </View>
      </View>

      {/* Expiry filter banner */}
      {expiryFilter && (
        <View style={[styles.filterBanner, {
          backgroundColor: expiryFilter === 'expired' ? '#fef2f2' : '#fff7ed',
          borderColor:     expiryFilter === 'expired' ? '#fecaca' : '#fed7aa',
        }]}>
          <Feather
            name={expiryFilter === 'expired' ? 'alert-octagon' : 'clock'}
            size={14}
            color={expiryFilter === 'expired' ? '#dc2626' : '#d97706'}
          />
          <Text style={[styles.filterBannerText, { color: expiryFilter === 'expired' ? '#b91c1c' : '#b45309' }]}>
            {expiryFilter === 'expired'
              ? `${filtered.length} product${filtered.length !== 1 ? 's' : ''} with expired batches`
              : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} expiring within 90 days`}
          </Text>
          <Pressable onPress={() => setExpiryFilter(null)} hitSlop={8}>
            <Feather name="x" size={15} color={expiryFilter === 'expired' ? '#b91c1c' : '#b45309'} />
          </Pressable>
        </View>
      )}

      {/* Product list */}
      <FlatList
        data={displayList}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          expiryFilter ? (
            <View style={styles.emptyState}>
              <Feather name={expiryFilter === 'expired' ? 'check-circle' : 'clock'} size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {expiryFilter === 'expired' ? 'No expired products in this branch.' : 'No products expiring soon.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title:    { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  pickerBtnText: { fontSize: 13, fontWeight: '600' },
  picker: {
    marginHorizontal: 16, marginTop: 4, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    zIndex: 100,
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  pickerItemText: { fontSize: 14, flex: 1 },
  summary: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  summaryCount: { fontSize: 16, fontWeight: '800' },
  summaryLabel: { fontSize: 11 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 28, marginHorizontal: 4 },
  list: { padding: 12, gap: 8 },
  filterBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 10, marginBottom: 2,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
  },
  filterBannerText: { flex: 1, fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
  },
  rowLeft:     { flex: 1, marginRight: 12 },
  productName: { fontSize: 14, fontWeight: '600' },
  productSub:  { fontSize: 11, marginTop: 2 },
  expiryRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  expiryLabel: { fontSize: 10, fontWeight: '700' },
  expiryDate:  { fontSize: 10, fontWeight: '600' },
  rowRight:    { alignItems: 'flex-end', gap: 4 },
  priceText:   { fontSize: 11, fontWeight: '600' },
  stockNum:    { fontSize: 18, fontWeight: '800' },
  chip:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  chipText:    { fontSize: 10, fontWeight: '700' },
});
