import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { WAREHOUSE, PRESIDENT, Order, BranchRequest } from '@/data/seeds';
import { PRODUCTS } from '@/data/products';

// ── Status chips ──────────────────────────────────────────────────────────────
function OrderChip({ status }: { status: Order['status'] }) {
  const colors = useColors();
  const map: Record<string, { bg: string; text: string }> = {
    'Order Request': { bg: colors.muted,              text: colors.mutedForeground },
    'On-going':      { bg: '#3b82f620',               text: '#3b82f6' },
    'Completed':     { bg: colors.accent + '20',      text: colors.accent },
    'Declined':      { bg: colors.destructive + '20', text: colors.destructive },
    'Not Received':  { bg: colors.warning + '20',     text: colors.warning },
  };
  const c = map[status] ?? map['Order Request'];
  return <View style={[styles.chip,{backgroundColor:c.bg}]}><Text style={[styles.chipText,{color:c.text}]}>{status}</Text></View>;
}

function RequestChip({ status }: { status: BranchRequest['status'] }) {
  const colors = useColors();
  const map: Record<string, { bg: string; text: string }> = {
    Pending:  { bg: '#f59e0b20', text: '#92400e' },
    Approved: { bg: colors.accent + '20', text: colors.accent },
    Declined: { bg: colors.destructive + '20', text: colors.destructive },
    Settled:  { bg: colors.muted, text: colors.mutedForeground },
  };
  const c = map[status] ?? { bg: colors.muted, text: colors.mutedForeground };
  return <View style={[styles.chip,{backgroundColor:c.bg}]}><Text style={[styles.chipText,{color:c.text}]}>{status}</Text></View>;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userBranch, orders, requests } = useApp();

  const isAdmin = userBranch === WAREHOUSE || userBranch === PRESIDENT;
  const [tab, setTab] = useState<'orders' | 'transfers'>('orders');

  // Warehouse orders visible to this user
  const myOrders = useMemo(() =>
    orders.filter(o => isAdmin || o.branch === userBranch),
    [orders, userBranch, isAdmin],
  );

  // Branch requests visible to this user
  const myRequests = useMemo(() =>
    isAdmin
      ? requests
      : requests.filter(r => r.fromBranch === userBranch || r.toBranch === userBranch),
    [requests, userBranch, isAdmin],
  );

  const orderStats = useMemo(() => ({
    completed: myOrders.filter(o => o.status === 'Completed').length,
    declined:  myOrders.filter(o => o.status === 'Declined').length,
    total:     myOrders.length,
  }), [myOrders]);

  const requestStats = useMemo(() => ({
    approved: myRequests.filter(r => r.status === 'Approved').length,
    declined: myRequests.filter(r => r.status === 'Declined').length,
    total:    myRequests.length,
  }), [myRequests]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root,{backgroundColor:colors.background}]}>
      {/* Header */}
      <View style={[styles.header,{backgroundColor:colors.primary,paddingTop:topPad+12}]}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar,{borderBottomColor:colors.border,backgroundColor:colors.card}]}>
        <TouchableOpacity
          onPress={() => setTab('orders')}
          style={[styles.tabItem, tab==='orders' && {borderBottomColor:colors.primary,borderBottomWidth:2}]}
        >
          <Text style={[styles.tabLabel,{color: tab==='orders' ? colors.primary : colors.mutedForeground}]}>
            Warehouse Orders
          </Text>
          <View style={[styles.tabBadge,{backgroundColor: tab==='orders' ? colors.primary+'15' : colors.muted}]}>
            <Text style={[styles.tabBadgeText,{color: tab==='orders' ? colors.primary : colors.mutedForeground}]}>
              {myOrders.length}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('transfers')}
          style={[styles.tabItem, tab==='transfers' && {borderBottomColor:colors.primary,borderBottomWidth:2}]}
        >
          <Feather name="repeat" size={12} color={tab==='transfers' ? colors.primary : colors.mutedForeground} style={{marginRight:4}} />
          <Text style={[styles.tabLabel,{color: tab==='transfers' ? colors.primary : colors.mutedForeground}]}>
            Branch Transfers
          </Text>
          <View style={[styles.tabBadge,{backgroundColor: tab==='transfers' ? colors.primary+'15' : colors.muted}]}>
            <Text style={[styles.tabBadgeText,{color: tab==='transfers' ? colors.primary : colors.mutedForeground}]}>
              {myRequests.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Orders list ── */}
      {tab === 'orders' && (
        <FlatList
          data={myOrders}
          keyExtractor={o => o.number}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS==='web' ? 34 : 16 }}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              {[
                { label: 'Total Orders', value: orderStats.total,     color: colors.primary },
                { label: 'Completed',    value: orderStats.completed, color: colors.accent },
                { label: 'Declined',     value: orderStats.declined,  color: colors.destructive },
              ].map(s => (
                <View key={s.label} style={[styles.statCard,{backgroundColor:colors.card,borderColor:colors.border}]}>
                  <Text style={[styles.statValue,{color:s.color}]}>{s.value}</Text>
                  <Text style={[styles.statLabel,{color:colors.mutedForeground}]}>{s.label}</Text>
                </View>
              ))}
            </View>
          }
          renderItem={({ item: o }) => {
            const totalQty = (o.items ?? []).reduce((s, i) => s + i.qty, 0);
            return (
              <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
                <View style={styles.cardRow}>
                  <View style={{flex:1,gap:2}}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                      <Text style={[styles.cardNum,{color:colors.foreground}]}>{o.number}</Text>
                      {o.priority === 'Urgent' && (
                        <View style={[styles.urgentBadge,{backgroundColor:colors.warning+'20'}]}>
                          <Text style={[styles.urgentText,{color:colors.warning}]}>Urgent</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.meta,{color:colors.mutedForeground}]}>
                      {o.date} · {totalQty} items{isAdmin ? ` · ${o.branch}` : ''}
                    </Text>
                  </View>
                  <OrderChip status={o.status} />
                </View>
                <View style={[styles.itemsPreview,{borderTopColor:colors.border}]}>
                  {(o.items ?? []).slice(0,2).map((item,idx) => {
                    const name = PRODUCTS.find(p => p.id === item.productId)?.name ?? `Product #${item.productId}`;
                    return <Text key={idx} style={[styles.itemText,{color:colors.mutedForeground}]} numberOfLines={1}>· {name} ×{item.qty}</Text>;
                  })}
                  {(o.items ?? []).length > 2 && (
                    <Text style={[styles.itemText,{color:colors.mutedForeground}]}>+{(o.items ?? []).length-2} more item{(o.items ?? []).length-2!==1?'s':''}</Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="clock" size={40} color={colors.border} />
              <Text style={[styles.emptyText,{color:colors.mutedForeground}]}>No orders yet</Text>
            </View>
          }
        />
      )}

      {/* ── Branch Transfers list ── */}
      {tab === 'transfers' && (
        <FlatList
          data={myRequests}
          keyExtractor={r => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS==='web' ? 34 : 16 }}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              {[
                { label: 'Total',    value: requestStats.total,    color: colors.primary },
                { label: 'Approved', value: requestStats.approved, color: colors.accent },
                { label: 'Declined', value: requestStats.declined, color: colors.destructive },
              ].map(s => (
                <View key={s.label} style={[styles.statCard,{backgroundColor:colors.card,borderColor:colors.border}]}>
                  <Text style={[styles.statValue,{color:s.color}]}>{s.value}</Text>
                  <Text style={[styles.statLabel,{color:colors.mutedForeground}]}>{s.label}</Text>
                </View>
              ))}
            </View>
          }
          renderItem={({ item: req }) => {
            const safeItems  = req.items ?? [];
            const totalQty   = safeItems.reduce((s, i) => s + i.qty, 0);
            const firstItem  = safeItems[0];
            const extraCount = safeItems.length - 1;
            const firstName  = PRODUCTS.find(p => p.id === firstItem?.productId)?.name ?? `Product #${firstItem?.productId}`;
            const direction  = userBranch === req.fromBranch ? 'Sent to' : userBranch === req.toBranch ? 'Received from' : null;
            const counterpart = userBranch === req.fromBranch ? req.toBranch : req.fromBranch;
            return (
              <View style={[styles.card,{backgroundColor:colors.card,borderColor:colors.border}]}>
                <View style={styles.cardRow}>
                  <View style={{flex:1,gap:2}}>
                    <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                      <Text style={[styles.cardNum,{color:colors.foreground}]}>{req.id}</Text>
                      {direction && (
                        <View style={[styles.directionBadge,{backgroundColor:colors.primary+'15'}]}>
                          <Text style={[styles.directionText,{color:colors.primary}]}>{direction}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.meta,{color:colors.mutedForeground}]}>
                      {req.date} · {totalQty} pcs
                      {isAdmin ? ` · ${req.fromBranch} → ${req.toBranch}` : (direction ? ` · ${counterpart}` : ` · ${req.fromBranch} → ${req.toBranch}`)}
                    </Text>
                  </View>
                  <RequestChip status={req.status} />
                </View>
                <View style={[styles.itemsPreview,{borderTopColor:colors.border}]}>
                  <Text style={[styles.itemText,{color:colors.mutedForeground}]} numberOfLines={1}>
                    · {firstName}{firstItem ? ` ×${firstItem.qty}` : ''}
                    {extraCount > 0 ? `  +${extraCount} more` : ''}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="repeat" size={40} color={colors.border} />
              <Text style={[styles.emptyText,{color:colors.mutedForeground}]}>No branch transfers yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex:1 },
  header:         { paddingHorizontal:20, paddingBottom:14 },
  headerTitle:    { fontSize:20, fontWeight:'700', color:'#fff' },
  tabBar:         { flexDirection:'row', borderBottomWidth:1 },
  tabItem:        { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:12, gap:5, borderBottomWidth:2, borderBottomColor:'transparent' },
  tabLabel:       { fontSize:12, fontWeight:'700' },
  tabBadge:       { borderRadius:10, paddingHorizontal:6, paddingVertical:2 },
  tabBadgeText:   { fontSize:11, fontWeight:'800' },
  statsRow:       { flexDirection:'row', padding:16, gap:10 },
  statCard:       { flex:1, borderRadius:12, padding:12, gap:4, borderWidth:1, alignItems:'center' },
  statValue:      { fontSize:22, fontWeight:'800' },
  statLabel:      { fontSize:11, fontWeight:'500', textAlign:'center' },
  card:           { marginHorizontal:16, marginBottom:10, borderRadius:14, borderWidth:1, padding:14 },
  cardRow:        { flexDirection:'row', alignItems:'flex-start', gap:10 },
  cardNum:        { fontSize:15, fontWeight:'700' },
  meta:           { fontSize:12, marginTop:2 },
  urgentBadge:    { paddingHorizontal:7, paddingVertical:2, borderRadius:6 },
  urgentText:     { fontSize:11, fontWeight:'700' },
  directionBadge: { paddingHorizontal:7, paddingVertical:2, borderRadius:6 },
  directionText:  { fontSize:11, fontWeight:'700' },
  chip:           { paddingHorizontal:10, paddingVertical:3, borderRadius:20 },
  chipText:       { fontSize:12, fontWeight:'700' },
  itemsPreview:   { borderTopWidth:1, marginTop:10, paddingTop:10, gap:3 },
  itemText:       { fontSize:12 },
  empty:          { alignItems:'center', paddingTop:80, gap:12 },
  emptyText:      { fontSize:15 },
});
