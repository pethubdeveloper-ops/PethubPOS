import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const pethubLogo = require('../../assets/images/pethub-logo.png');

interface MenuItem {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  privileged?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Transactions',
    description: 'Browse all past transactions',
    icon: 'clock',
    route: '/tabs/history',
    color: '#6366f1',
  },
  {
    label: 'Branch Inventory',
    description: 'View stock levels per branch',
    icon: 'layers',
    route: '/tabs/inventory',
    color: '#3b82f6',
  },
  {
    label: 'Loans',
    description: 'Track loan orders & collect payments',
    icon: 'credit-card',
    route: '/tabs/loans',
    color: '#f59e0b',
    privileged: true,
  },
  {
    label: 'Purchase Orders',
    description: 'Manage incoming stock orders',
    icon: 'shopping-cart',
    route: '/tabs/purchase-orders',
    color: '#f97316',
    privileged: true,
  },
  {
    label: 'Suppliers',
    description: 'Manage product suppliers',
    icon: 'briefcase',
    route: '/tabs/suppliers',
    color: '#8b5cf6',
    privileged: true,
  },
  {
    label: 'Reports',
    description: 'Generate and export operational reports',
    icon: 'file-text',
    route: '/tabs/reports',
    color: '#0ea5e9',
    privileged: true,
  },
  {
    label: 'Branch Management',
    description: 'Create branch accounts and locations',
    icon: 'git-branch',
    route: '/tabs/branches',
    color: '#059669',
    privileged: true,
  },
  {
    label: 'Profile',
    description: 'Account info and sign out',
    icon: 'user',
    route: '/tabs/profile',
    color: '#10b981',
  },
];

export default function MoreScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { userBranch, userRole, isPrivileged } = useApp();

  const roleLabel =
    userRole === 'president' ? 'President / Owner' :
    userRole === 'warehouse' ? 'Warehouse Manager' :
    'Branch Staff';

  const visible = MENU_ITEMS.filter(item => !item.privileged || isPrivileged);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
    >
      {/* User card */}
      <View style={[styles.userCard, { paddingTop: insets.top + 20, backgroundColor: colors.primary }]}>
        <Image source={pethubLogo} style={styles.logo} />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{userBranch}</Text>
          <Text style={styles.userRole}>{roleLabel}</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FEATURES</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {visible.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                { borderBottomColor: colors.border },
                index === visible.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => router.navigate(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APP</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>1.0.0</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Sync</Text>
            <View style={styles.syncBadge}>
              <View style={[styles.syncDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.infoValue, { color: colors.foreground }]}>Live</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Build</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>ShoPET Internal</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
        Shop with love, no bashing 🐾
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 24,
  },
  logo:     { width: 52, height: 52, borderRadius: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  userRole: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  section:      { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  menuCard:     { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },

  menuItem:  {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon:  { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuText:  { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDesc:  { fontSize: 12, marginTop: 1 },

  infoRow:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncDot:   { width: 8, height: 8, borderRadius: 4 },

  tagline: { fontSize: 12, textAlign: 'center', marginTop: 24, marginBottom: 8 },
});
