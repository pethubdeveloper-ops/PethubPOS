import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert, ScrollView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key: string) {
  const [yr, mo] = key.split('-').map(Number);
  return `${MONTHS_SHORT[mo - 1]} '${String(yr).slice(2)}`;
}
import { PRODUCTS } from '@/data/products';

type LoanFilter = 'outstanding' | 'paid' | 'all';

function fmt(n: number) {
  return n === 0 ? '—' : '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function calcOrderTotal(order: { items: { productId: number; qty: number }[] }) {
  return order.items.reduce((sum, item) => {
    const p = PRODUCTS.find(pr => pr.id === item.productId);
    return sum + (p?.price ?? 0) * item.qty;
  }, 0);
}

export default function LoansScreen() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { userBranch, orders, updateOrderStatus, branchNames, isPrivileged } = useApp();

  const isAdmin = isPrivileged;
  const [filter,         setFilter]         = useState<LoanFilter>('outstanding');
  const [expanded,       setExpanded]       = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');  // '' = all
  const [selectedMonth,  setSelectedMonth]  = useState('');  // '' = all

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const loanOrders = useMemo(() =>
    orders.filter(o =>
      (o.status === 'Pending Payment' || o.status === 'Completed') &&
      (isAdmin || o.branch === userBranch)
    ), [orders, userBranch, isAdmin]);

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    loanOrders.forEach(o => { const k = monthKey(o.date); if (k) s.add(k); });
    return Array.from(s).sort().reverse();
  }, [loanOrders]);

  const filtered = useMemo(() => {
    let list = loanOrders;
    if (filter === 'outstanding') list = list.filter(o => o.status === 'Pending Payment');
    else if (filter === 'paid')   list = list.filter(o => o.status === 'Completed');
    if (selectedBranch) list = list.filter(o => o.branch === selectedBranch);
    if (selectedMonth)  list = list.filter(o => monthKey(o.date) === selectedMonth);
    return list;
  }, [loanOrders, filter, selectedBranch, selectedMonth]);

  const counts = useMemo(() => ({
    outstanding: loanOrders.filter(o => o.status === 'Pending Payment').length,
    paid:        loanOrders.filter(o => o.status === 'Completed').length,
    all:         loanOrders.length,
  }), [loanOrders]);

  const totalOutstanding = useMemo(() =>
    loanOrders
      .filter(o => o.status === 'Pending Payment')
      .reduce((sum, o) => sum + calcOrderTotal(o), 0),
    [loanOrders]);

  const FILTERS: { key: LoanFilter; label: string }[] = [
    { key: 'outstanding', label: 'Pending' },
    { key: 'paid',        label: 'Paid' },
    { key: 'all',         label: 'All' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Loans</Text>
        <Text style={styles.headerSub}>Track loan orders & collect payments</Text>
      </View>

      {/* Summary cards */}
      <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.summaryCard, { borderRightColor: colors.border }]}>
          <Text style={[styles.summaryNum, { color: '#b45309' }]}>{counts.outstanding}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { borderRightColor: colors.border }]}>
          <Text style={[styles.summaryNum, { color: '#16a34a' }]}>{counts.paid}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Paid</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNum, { color: colors.primary }]}>{fmt(totalOutstanding)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Outstanding</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.tab, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
            >
              <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.mutedForeground }]}>
                {f.label}
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: isActive ? colors.primary : colors.muted }]}>
                <Text style={[styles.tabBadgeText, { color: isActive ? '#fff' : colors.mutedForeground }]}>
                  {counts[f.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Branch + Month filter chips (admin only) */}
      {isAdmin && (
        <View style={styles.filterSection}>
          {/* Month chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Pressable
              onPress={() => setSelectedMonth('')}
              style={[styles.chip, { borderColor: selectedMonth === '' ? '#1a7a5c' : '#d1d5db', backgroundColor: selectedMonth === '' ? '#1a7a5c' : 'transparent' }]}
            >
              <Text style={[styles.chipText, { color: selectedMonth === '' ? '#fff' : '#6b7280' }]}>All Months</Text>
            </Pressable>
            {availableMonths.map(m => (
              <Pressable
                key={m}
                onPress={() => setSelectedMonth(selectedMonth === m ? '' : m)}
                style={[styles.chip, { borderColor: selectedMonth === m ? '#1a7a5c' : '#d1d5db', backgroundColor: selectedMonth === m ? '#1a7a5c' : 'transparent' }]}
              >
                <Text style={[styles.chipText, { color: selectedMonth === m ? '#fff' : '#6b7280' }]}>{monthLabel(m)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Branch chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Pressable
              onPress={() => setSelectedBranch('')}
              style={[styles.chip, { borderColor: selectedBranch === '' ? '#1a7a5c' : '#d1d5db', backgroundColor: selectedBranch === '' ? '#1a7a5c' : 'transparent' }]}
            >
              <Text style={[styles.chipText, { color: selectedBranch === '' ? '#fff' : '#6b7280' }]}>All Branches</Text>
            </Pressable>
            {branchNames.map(b => {
              const short = b.replace(' Branch', '').replace(', Bacoor', '');
              const active = selectedBranch === b;
              return (
                <Pressable
                  key={b}
                  onPress={() => setSelectedBranch(active ? '' : b)}
                  style={[styles.chip, { borderColor: active ? '#1a7a5c' : '#d1d5db', backgroundColor: active ? '#1a7a5c' : 'transparent' }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : '#6b7280' }]}>{short}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={o => o.number}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="credit-card" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {filter === 'outstanding' ? 'No outstanding loan payments' : 'No loan orders found'}
            </Text>
          </View>
        }
        renderItem={({ item: order }) => {
          const isExpanded = expanded === order.number;
          const total = calcOrderTotal(order);
          const isPending = order.status === 'Pending Payment';
          const isPaid    = order.status === 'Completed';

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header row */}
              <Pressable
                onPress={() => setExpanded(isExpanded ? null : order.number)}
                style={styles.cardHeader}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.orderNum, { color: colors.foreground }]}>{order.number}</Text>
                  <Text style={[styles.orderMeta, { color: colors.mutedForeground }]}>
                    {order.date} · {order.branch}
                  </Text>
                  <Text style={[styles.orderAmount, { color: colors.primary }]}>{fmt(total)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: isPaid ? '#16a34a20' : isPending ? '#f59e0b20' : colors.muted },
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: isPaid ? '#16a34a' : isPending ? '#b45309' : colors.mutedForeground },
                    ]}>
                      {isPaid ? 'Paid' : isPending ? 'Pending' : order.status}
                    </Text>
                  </View>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </View>
              </Pressable>

              {/* Expanded body */}
              {isExpanded && (
                <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
                  {/* Items */}
                  {order.items.map((item, idx) => {
                    const product   = PRODUCTS.find(p => p.id === item.productId);
                    const unitPrice = product?.price ?? 0;
                    return (
                      <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                          {product?.name ?? `Product #${item.productId}`}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.itemQty, { color: colors.foreground }]}>×{item.qty}</Text>
                          {unitPrice > 0 && (
                            <Text style={[styles.itemAmt, { color: colors.mutedForeground }]}>
                              {fmt(unitPrice * item.qty)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* Payment info */}
                  <View style={[styles.payRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.payKey, { color: colors.mutedForeground }]}>Terms</Text>
                    <Text style={[styles.payVal, { color: colors.foreground }]}>{(order as any).terms ?? '—'}</Text>
                  </View>
                  <View style={styles.payRow}>
                    <Text style={[styles.payKey, { color: colors.mutedForeground }]}>Total Due</Text>
                    <Text style={[styles.payVal, { color: colors.primary, fontWeight: '800' }]}>{fmt(total)}</Text>
                  </View>

                  {/* Admin action */}
                  {isAdmin && isPending && (
                    <Pressable
                      onPress={() => Alert.alert(
                        'Receive Payment',
                        `Confirm payment received for order ${order.number}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Confirm', onPress: () => { updateOrderStatus(order.number, 'Completed'); setExpanded(null); } },
                        ]
                      )}
                      style={[styles.confirmBtn, { backgroundColor: '#16a34a' }]}
                    >
                      <Feather name="check-circle" size={16} color="#fff" />
                      <Text style={styles.confirmBtnText}>Receive Payment</Text>
                    </Pressable>
                  )}

                  {isPaid && (
                    <View style={[styles.paidBadge, { backgroundColor: '#16a34a18', borderColor: '#16a34a40' }]}>
                      <Feather name="check-circle" size={14} color="#16a34a" />
                      <Text style={[styles.paidText, { color: '#16a34a' }]}>Payment Collected</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  header:       { paddingHorizontal: 20, paddingBottom: 14 },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  summaryRow:   { flexDirection: 'row', borderBottomWidth: 1 },
  summaryCard:  { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: StyleSheet.hairlineWidth },
  summaryNum:   { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2 },

  tabs:         { flexDirection: 'row', borderBottomWidth: 1 },
  tab:          { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12 },
  tabText:      { fontSize: 13, fontWeight: '600' },
  tabBadge:     { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10 },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },

  empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText:    { fontSize: 15 },

  card:         { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  orderNum:     { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  orderMeta:    { fontSize: 12 },
  orderAmount:  { fontSize: 14, fontWeight: '700' },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: '700' },

  cardBody:     { borderTopWidth: 1, paddingHorizontal: 14, paddingBottom: 14 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  itemName:     { fontSize: 13, flex: 1, fontWeight: '500' },
  itemQty:      { fontSize: 13, fontWeight: '700' },
  itemAmt:      { fontSize: 11 },

  payRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4 },
  payKey:       { fontSize: 13 },
  payVal:       { fontSize: 13, fontWeight: '600' },

  confirmBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10, marginTop: 12 },
  confirmBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },

  paidBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 12 },
  paidText:     { fontSize: 13, fontWeight: '600' },

  filterSection: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 6 },
  chipRow:       { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  chip:          { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  chipText:      { fontSize: 12, fontWeight: '600' },
});
