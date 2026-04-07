import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { fmt, C, vendorTypeEmoji, inpS } from '../helpers';

export function VendorsScreen({ nav, dark }: { nav: (s: string, p?: any) => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [vType, setVType] = useState('supplier');
  const [mobile, setMobile] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      setError('');
      const r = await api.get('/vendors');
      setVendors(r.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addVendor = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name required');
    setAdding(true);
    try {
      await api.post('/vendors', { name: name.trim(), type: vType, mobile: mobile.trim() || undefined });
      setShowAdd(false); setName(''); setMobile('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.primary} /></View>;
  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: C.danger, fontSize: 15, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
      <TouchableOpacity onPress={load} style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const vTypes = ['supplier', 'labor_contractor', 'transporter', 'broker', 'engineer', 'other'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: txt }}>Vendors</Text>
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={{ backgroundColor: showAdd ? inputBg : C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24 }}>
            <Text style={{ color: showAdd ? txt : '#fff', fontWeight: '600', fontSize: 14 }}>{showAdd ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
            <TextInput placeholder="Vendor Name *" value={name} onChangeText={setName} style={inpS(dark)} placeholderTextColor={C.sub} />
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {vTypes.map(t => (
                <TouchableOpacity key={t} onPress={() => setVType(t)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: vType === t ? C.primary : inputBg, borderWidth: 1, borderColor: vType === t ? C.primary : border }}>
                  <Text style={{ color: vType === t ? '#fff' : txt, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>{vendorTypeEmoji[t] || '📋'} {t.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput placeholder="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" style={inpS(dark)} placeholderTextColor={C.sub} />
            <TouchableOpacity onPress={addVendor} disabled={adding} style={{ backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{adding ? 'Adding...' : 'Add Vendor'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {vendors.length === 0 ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}><Text style={{ color: C.sub, fontSize: 14 }}>No vendors</Text></View>
        ) : vendors.map(v => (
          <TouchableOpacity key={v.id || v._id} onPress={() => nav('vendorDetail', { vendorId: v.id || v._id })} style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1' + '18', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 20 }}>{vendorTypeEmoji[v.type] || '📦'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: txt, fontWeight: '600', fontSize: 15 }}>{v.name}</Text>
              <Text style={{ color: C.sub, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>{(v.type || 'general').replace('_', ' ')}{v.mobile ? ' · ' + v.mobile : ''}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
