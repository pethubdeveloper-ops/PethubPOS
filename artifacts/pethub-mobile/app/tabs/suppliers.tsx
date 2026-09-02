import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, Alert, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp, Supplier } from '@/context/AppContext';
import { WAREHOUSE, PRESIDENT } from '@/data/seeds';

interface FormState { companyName: string; email: string; }
const EMPTY: FormState = { companyName: '', email: '' };

export default function SuppliersScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { userBranch, suppliers, addSupplier, editSupplier, removeSupplier } = useApp();

  const [showModal,  setShowModal]  = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [errors,     setErrors]     = useState<Partial<FormState>>({});
  const [isSaving,   setIsSaving]   = useState(false);

  const isAllowed = userBranch === WAREHOUSE || userBranch === PRESIDENT;

  if (!isAllowed) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={[styles.lockText, { color: colors.mutedForeground }]}>
          Suppliers are only accessible to{'\n'}Warehouse and President accounts.
        </Text>
      </View>
    );
  }

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.companyName.trim()) e.companyName = 'Required';
    if (!form.email.trim())       e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => { setForm(EMPTY); setErrors({}); setEditingId(null); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setForm({ companyName: s.companyName, email: s.email });
    setErrors({});
    setEditingId(s.id);
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!validate()) return;
    if (editingId) {
      editSupplier(editingId, form);
      setShowModal(false);
      return;
    }
    setIsSaving(true);
    try {
      await addSupplier(form);
      setShowModal(false);
    } catch {
      Alert.alert(
        'Could Not Add Supplier',
        'The server is temporarily unreachable. Please check your connection and try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSaving(false);
    }
  };
  const handleRemove = (s: Supplier) => {
    Alert.alert('Remove Supplier', `Remove "${s.companyName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSupplier(s.id) },
    ]);
  };

  const renderItem = ({ item }: { item: Supplier }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
        <Feather name="briefcase" size={18} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.company, { color: colors.foreground }]} numberOfLines={1}>
          {item.companyName}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={styles.poRow}>
          <Feather name="shopping-cart" size={11} color={colors.mutedForeground} />
          <Text style={[styles.poText, { color: colors.mutedForeground }]}>
            {item.purchaseOrders} purchase order{item.purchaseOrders !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.muted }]}
          onPress={() => openEdit(item)}
        >
          <Feather name="edit-2" size={14} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.destructive + '18' }]}
          onPress={() => handleRemove(item)}
        >
          <Feather name="trash-2" size={14} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const s = StyleSheet.create({
    field: { marginBottom: 14 },
    fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' },
    input: {
      borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
      fontSize: 14, fontWeight: '500',
    },
    errorText: { fontSize: 11, marginTop: 4 },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Suppliers</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}
          </Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={suppliers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="briefcase" size={36} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No suppliers yet</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Tap "Add" to get started</Text>
          </View>
        }
      />

      {/* Add / Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingId ? 'Edit Supplier' : 'Add Supplier'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Company Name */}
            <View style={s.field}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Company Name</Text>
              <TextInput
                value={form.companyName}
                onChangeText={v => setForm(prev => ({ ...prev, companyName: v }))}
                style={[s.input, { borderColor: errors.companyName ? colors.destructive : colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="e.g. PetWorld Distributors"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
              {errors.companyName && <Text style={[s.errorText, { color: colors.destructive }]}>{errors.companyName}</Text>}
            </View>
            {/* Email */}
            <View style={s.field}>
              <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
              <TextInput
                value={form.email}
                onChangeText={v => setForm(prev => ({ ...prev, email: v }))}
                style={[s.input, { borderColor: errors.email ? colors.destructive : colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="e.g. orders@supplier.ph"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={[s.errorText, { color: colors.destructive }]}>{errors.email}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Feather name={isSaving ? 'loader' : 'check'} size={16} color="#fff" />
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Supplier'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  lockText:  { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title:    { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  company:  { fontSize: 15, fontWeight: '700' },
  email:    { fontSize: 12 },
  poRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  poText:   { fontSize: 11 },
  actions:  { flexDirection: 'row', gap: 8 },
  actionBtn:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyText:    { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptySubText: { fontSize: 13 },
  modal:     { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn:   { padding: 4 },
  modalBody:  { padding: 20 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
