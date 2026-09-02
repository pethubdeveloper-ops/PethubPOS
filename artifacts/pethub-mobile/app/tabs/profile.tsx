import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Modal, TextInput, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { WAREHOUSE, PRESIDENT } from '@/data/seeds';

const shopetLogo = require('../../assets/images/shopet-logo.jpg');

// ─── InfoRow ────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primary + '12' }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── ChangePasswordModal ─────────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { changePassword, username } = useApp();
  const [oldPw,   setOldPw]   = useState('');
  const [newPw,   setNewPw]   = useState('');
  const [confPw,  setConfPw]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const reset = () => {
    setOldPw(''); setNewPw(''); setConfPw('');
    setError(''); setSaving(false);
    setShowOld(false); setShowNew(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!oldPw) { setError('Enter your current password.'); return; }
    if (newPw.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPw !== confPw) { setError('New passwords do not match.'); return; }
    setSaving(true); setError('');
    try {
      await changePassword(oldPw, newPw);
      reset(); onClose();
      Alert.alert('Password Changed', 'Your password has been updated successfully.');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={cpStyles.overlay} onPress={handleClose}>
        <Pressable style={[cpStyles.card, { backgroundColor: colors.card }]} onPress={() => {}}>
          <Text style={[cpStyles.title, { color: colors.foreground }]}>Change Password</Text>
          {username ? (
            <Text style={[cpStyles.sub, { color: colors.mutedForeground }]}>Account: {username}</Text>
          ) : null}

          {/* Current password */}
          <View style={cpStyles.field}>
            <Text style={[cpStyles.label, { color: colors.mutedForeground }]}>Current Password</Text>
            <View style={[cpStyles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="lock" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[cpStyles.input, { color: colors.foreground }]}
                value={oldPw}
                onChangeText={(t) => { setOldPw(t); setError(''); }}
                secureTextEntry={!showOld}
                placeholder="Current password"
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable onPress={() => setShowOld((v) => !v)} hitSlop={8}>
                <Feather name={showOld ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* New password */}
          <View style={cpStyles.field}>
            <Text style={[cpStyles.label, { color: colors.mutedForeground }]}>New Password</Text>
            <View style={[cpStyles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="key" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[cpStyles.input, { color: colors.foreground }]}
                value={newPw}
                onChangeText={(t) => { setNewPw(t); setError(''); }}
                secureTextEntry={!showNew}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedForeground}
              />
              <Pressable onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                <Feather name={showNew ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View style={cpStyles.field}>
            <Text style={[cpStyles.label, { color: colors.mutedForeground }]}>Confirm New Password</Text>
            <View style={[cpStyles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="check-circle" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[cpStyles.input, { color: colors.foreground }]}
                value={confPw}
                onChangeText={(t) => { setConfPw(t); setError(''); }}
                secureTextEntry
                placeholder="Repeat new password"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          {error ? (
            <Text style={[cpStyles.error, { color: colors.destructive }]}>{error}</Text>
          ) : null}

          <View style={cpStyles.btnRow}>
            <TouchableOpacity
              style={[cpStyles.btn, cpStyles.cancel, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[cpStyles.btnText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cpStyles.btn, cpStyles.save, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={[cpStyles.btnText, { color: '#fff' }]}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const cpStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 4 },
  title:    { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  sub:      { fontSize: 13, marginBottom: 12 },
  field:    { marginTop: 14 },
  label:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  input:    { flex: 1, paddingVertical: 12, fontSize: 15 },
  error:    { fontSize: 13, fontWeight: '600', marginTop: 10 },
  btnRow:   { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn:      { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancel:   { borderWidth: 1 },
  save:     {},
  btnText:  { fontSize: 15, fontWeight: '700' },
});

// ─── ProfileScreen ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { userBranch, logout, orders, products, suppliers, username, changePassword } = useApp();
  const [showChangePw, setShowChangePw] = useState(false);

  const isWarehouse = userBranch === WAREHOUSE;
  const isPresident = userBranch === PRESIDENT;

  const myOrders = orders.filter(o =>
    isWarehouse || isPresident ? true : o.branch === userBranch
  ).length;

  const pendingOrders = orders.filter(o =>
    o.status === 'Order Request' && (isWarehouse || isPresident || o.branch === userBranch)
  ).length;

  const completedOrders = orders.filter(o =>
    o.status === 'Completed' && (isWarehouse || isPresident || o.branch === userBranch)
  ).length;

  const roleLabel =
    isPresident ? 'President / Owner' :
    isWarehouse ? 'Warehouse Manager' :
    'Branch Staff';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 24, backgroundColor: colors.primary }]}>
          <Image source={shopetLogo} style={styles.logo} />
          <Text style={styles.heroName}>{userBranch}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
          <Text style={styles.heroSub}>Pet Hub Shop · ShoPET Internal</Text>
        </View>

        {/* Quick stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{myOrders}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
              {isWarehouse || isPresident ? 'Total Orders' : 'My Orders'}
            </Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingOrders}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Pending</Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.accent }]}>{completedOrders}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Completed</Text>
          </View>
        </View>

        {/* Account info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <InfoRow icon="map-pin"   label="Branch / Account"  value={userBranch ?? '-'} />
          <InfoRow icon="shield"    label="Role"               value={roleLabel} />
          <InfoRow icon="package"   label="Products Catalogue" value={`${products.length} items`} />
          {(isWarehouse || isPresident) && (
            <InfoRow icon="briefcase" label="Suppliers" value={`${suppliers.length} active`} />
          )}
        </View>

        {/* App info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APPLICATION</Text>
          <InfoRow icon="info"       label="Version"     value="1.0.0" />
          <InfoRow icon="server"     label="Environment" value="ShoPET Internal POS" />
          <InfoRow icon="refresh-cw" label="Sync"        value="Live · every 5 seconds" />
        </View>

        {/* Security — Change Password */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SECURITY</Text>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={() => setShowChangePw(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '12' }]}>
              <Feather name="key" size={16} color={colors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>Change Password</Text>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Update your account password</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutWrap}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.destructive + '50' }]}
            onPress={logout}
            activeOpacity={0.75}
          >
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={[styles.logoutHint, { color: colors.mutedForeground }]}>
            Shop with love, no bashing 🐾
          </Text>
        </View>
      </ScrollView>

      <ChangePasswordModal visible={showChangePw} onClose={() => setShowChangePw(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    alignItems: 'center', paddingBottom: 32, paddingHorizontal: 24,
  },
  logo:    { width: 72, height: 72, borderRadius: 18, marginBottom: 14 },
  heroName:{ fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  roleBadge: {
    marginTop: 8, paddingHorizontal: 14, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  heroSub:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 8 },

  statsRow: {
    flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum:  { fontSize: 24, fontWeight: '800' },
  statLbl:  { fontSize: 11, textAlign: 'center' },
  statDiv:  { width: StyleSheet.hairlineWidth, marginHorizontal: 8 },

  section: {
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1 },
  infoLabel:{ fontSize: 11 },
  infoValue:{ fontSize: 14, fontWeight: '600', marginTop: 1 },

  logoutWrap: { marginHorizontal: 16, marginTop: 24, alignItems: 'center', gap: 12 },
  logoutBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  logoutHint: { fontSize: 12 },
});
