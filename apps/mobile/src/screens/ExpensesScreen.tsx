import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, amtWords, C, typeEmoji, payColor } from '../helpers';

export function ExpensesScreen({ dark }: { dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try {
      setError('');
      const r = await api.get('/expenses', { params: { limit: 50 } });
      setExpenses(r.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: C.danger, fontSize: 15, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
      <TouchableOpacity onPress={load} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const typeBg: Record<string, string> = { material: '#FFF3E0', labor: '#E3F2FD', transport: '#F3E5F5', rental: '#E8F5E9', commission: '#FFF8E1', miscellaneous: '#F5F5F5' };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: txt, marginBottom: 16 }}>History</Text>
          {expenses.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><Text style={{ color: C.sub, fontSize: 14 }}>No expenses yet</Text></View>
          ) : expenses.map((exp: any, i: number) => (
            <TouchableOpacity key={exp.id || i} onPress={() => setSelected(exp)} style={{ backgroundColor: card, padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: typeBg[exp.expenseType] || '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 20 }}>{typeEmoji[exp.expenseType] || '📋'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: txt, fontWeight: '600', fontSize: 15 }}>{exp.itemName}</Text>
                <Text style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{exp.site?.siteName || ''} · {new Date(exp.expenseDate).toLocaleDateString('en-GB')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: txt, fontWeight: '700', fontSize: 16 }}>{fmt(exp.totalAmount || 0)}</Text>
                <View style={{ backgroundColor: (payColor[exp.paymentStatus] || C.sub) + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: payColor[exp.paymentStatus] || C.sub }}>{exp.paymentStatus?.replace('_', ' ')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, backgroundColor: border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: txt, fontSize: 20, fontWeight: '800', marginBottom: 16 }}>Expense Detail</Text>
            {selected && (
              <View>
                <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{selected.itemName}</Text>
                {[
                  { ic: '📋', l: 'Type', v: selected.expenseType },
                  { ic: '🏗️', l: 'Site', v: selected.site?.siteName || '-' },
                  { ic: '🔢', l: 'Qty', v: `${selected.quantity} ${selected.unit} x ${fmt(selected.rate)}` },
                  { ic: '💳', l: 'Payment', v: selected.paymentStatus?.replace('_', ' ') },
                  { ic: '🏪', l: 'Vendor', v: selected.vendor?.name || '-' },
                  { ic: '📅', l: 'Date', v: selected.expenseDate ? new Date(selected.expenseDate).toLocaleDateString('en-GB') : '-' },
                  { ic: '🧾', l: 'Bill No', v: selected.billNumber || '-' },
                  { ic: '📝', l: 'Remarks', v: selected.remarks || '-' },
                ].map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border }}>
                    <Text style={{ color: C.sub, fontSize: 14 }}>{r.ic} {r.l}</Text>
                    <Text style={{ color: txt, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' }}>{r.v}</Text>
                  </View>
                ))}
                <Text style={{ color: C.primary, fontSize: 24, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>{fmt(selected.totalAmount || 0)}</Text>
                <Text style={{ color: C.sub, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>{amtWords(selected.totalAmount || 0)}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: inputBg, padding: 14, borderRadius: 14, alignItems: 'center' }}>
                <Text style={{ color: txt, fontWeight: '600', fontSize: 15 }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Delete Expense', 'Are you sure?', [
                    { text: 'Cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        await api.delete(`/expenses/${selected.id}`);
                        Alert.alert('Deleted');
                        setSelected(null);
                        load();
                      } catch { Alert.alert('Error', 'Failed to delete'); }
                    }},
                  ]);
                }}
                style={{ flex: 1, backgroundColor: C.danger, padding: 14, borderRadius: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
