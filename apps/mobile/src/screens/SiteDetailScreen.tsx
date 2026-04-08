import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api';
import { fmt, amtWords, C, API_HOST, inpS } from '../helpers';

export function SiteDetailScreen({ siteId, back, nav, dark }: { siteId: string; back: () => void; nav: (s: string, p?: any) => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const load = async () => {
    try {
      setError('');
      const r = await api.get(`/sites/${siteId}/dashboard`);
      setData(r.data?.data || {});
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (status: string) => {
    try { await api.put(`/sites/${siteId}`, { status }); load(); } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
  };

  const deleteSite = () => {
    Alert.alert('Delete Site', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/sites/${siteId}`); back(); } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
      }},
    ]);
  };

  const uploadDoc = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled) return;
      setUploading(true);
      const uri = res.assets[0].uri;
      const fname = uri.split('/').pop() || 'photo.jpg';
      const form = new FormData();
      form.append('file', { uri, name: fname, type: 'image/jpeg' } as any);
      await api.post(`/sites/${siteId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    Alert.alert('Delete?', 'Remove this document?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/sites/${siteId}/documents/${docId}`); load(); } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
      }},
    ]);
  };

  const saveEdit = async () => {
    try {
      await api.put(`/sites/${siteId}`, editForm);
      setEditing(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed');
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
  if (!data) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.sub }}>Site not found</Text></View>;

  const s = data.site || data;
  const sum = data.summary || {};
  const spent = sum.totalCost || 0;
  const budgetAmt = s.estimatedBudget || 0;
  const remaining = budgetAmt - spent;
  const progress = budgetAmt > 0 ? Math.min((spent / budgetAmt) * 100, 100) : 0;
  const topItems = data.topItems || [];
  const recentExpenses = data.recentExpenses || [];
  const docs = s.siteImages || [];
  const statuses = ['planning', 'active', 'on_hold', 'completed'];

  const custEst = s.customerEstimate || 0;
  const buildEst = s.builderEstimate || 0;
  const saleAmt = s.saleAmount || 0;
  const profitLoss = saleAmt > 0 ? saleAmt - spent : custEst - spent;
  const marginPct = saleAmt > 0 ? (saleAmt > 0 ? ((profitLoss / saleAmt) * 100) : 0) : (custEst > 0 ? ((profitLoss / custEst) * 100) : 0);
  const sqftVal = s.totalSqft || 0;
  const hasSqftData = sqftVal > 0 && (s.customerRatePerSqft > 0 || s.builderRatePerSqft > 0);
  const costPerSqft = sqftVal > 0 ? spent / sqftVal : 0;
  const matPerSqft = sqftVal > 0 ? (sum.materialCost || 0) / sqftVal : 0;
  const labPerSqft = sqftVal > 0 ? (sum.laborCost || 0) / sqftVal : 0;
  // Effective budget for progress display
  const effectiveBudget = buildEst > 0 ? buildEst : budgetAmt;
  const effectiveRemaining = effectiveBudget - spent;
  const effectiveProgress = effectiveBudget > 0 ? Math.min((spent / effectiveBudget) * 100, 100) : 0;
  const progressColor = effectiveProgress > 90 ? C.danger : effectiveProgress >= 60 ? C.warning : C.success;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={back} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        {/* Site Info */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: txt }}>{s.siteName || 'Site'}</Text>
        <Text style={{ color: C.sub, marginTop: 6, fontSize: 14 }}>{s.siteCode} · {s.projectType} · {s.status}</Text>
        {s.clientName ? <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }}>👤 {s.clientName}</Text> : null}
        {s.address ? <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }}>📍 {s.address}</Text> : null}
        {sqftVal > 0 ? <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }}>📐 {sqftVal} sqft</Text> : null}

        {/* Status buttons */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {statuses.map(st => (
            <TouchableOpacity key={st} onPress={() => changeStatus(st)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: s.status === st ? C.primary : inputBg, borderWidth: 1, borderColor: s.status === st ? C.primary : border }}>
              <Text style={{ color: s.status === st ? '#fff' : txt, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>{st.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget Overview — Always visible */}
        <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 16, marginTop: 20 }}>
          {/* Budget */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: C.sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Estimated Budget</Text>
            <Text style={{ color: C.primary, fontSize: 28, fontWeight: '800', marginTop: 4 }}>{effectiveBudget > 0 ? fmt(effectiveBudget) : 'Not Set'}</Text>
            {effectiveBudget > 0 && <Text style={{ color: C.sub, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>{amtWords(effectiveBudget)}</Text>}
          </View>

          {/* Spent & Remaining row */}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: spent > effectiveBudget && effectiveBudget > 0 ? '#FEF2F2' : '#FFF7ED', borderRadius: 12, marginRight: 6 }}>
              <Text style={{ color: C.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Spent</Text>
              <Text style={{ color: spent > effectiveBudget && effectiveBudget > 0 ? C.danger : '#EA580C', fontSize: 20, fontWeight: '800', marginTop: 4 }}>{fmt(spent)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: effectiveRemaining >= 0 ? '#F0FDF4' : '#FEF2F2', borderRadius: 12, marginLeft: 6 }}>
              <Text style={{ color: C.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>{effectiveRemaining >= 0 ? 'Remaining' : 'Over Budget'}</Text>
              <Text style={{ color: effectiveRemaining >= 0 ? C.success : C.danger, fontSize: 20, fontWeight: '800', marginTop: 4 }}>{effectiveBudget > 0 ? fmt(Math.abs(effectiveRemaining)) : '-'}</Text>
            </View>
          </View>

          {/* Progress Bar — Large */}
          {effectiveBudget > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: C.sub, fontSize: 12, fontWeight: '600' }}>Budget Used</Text>
                <Text style={{ color: progressColor, fontSize: 16, fontWeight: '800' }}>{effectiveProgress.toFixed(1)}%</Text>
              </View>
              <View style={{ height: 12, backgroundColor: inputBg, borderRadius: 6 }}>
                <View style={{ height: 12, backgroundColor: progressColor, borderRadius: 6, width: `${Math.min(effectiveProgress, 100)}%` }} />
              </View>
              <Text style={{ color: effectiveRemaining >= 0 ? C.success : C.danger, fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'right' }}>
                {effectiveRemaining >= 0 ? `${fmt(effectiveRemaining)} remaining` : `${fmt(Math.abs(effectiveRemaining))} over budget`}
              </Text>
            </View>
          )}
          {effectiveBudget === 0 && (
            <Text style={{ color: C.sub, fontSize: 12, textAlign: 'center', marginTop: 8 }}>No budget set. Edit site to add budget.</Text>
          )}
        </View>

        {/* SQFT-based Financial Cards — Only when SQFT data exists */}
        {hasSqftData && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {[
              custEst > 0 ? { l: 'Customer Estimate', v: custEst, cl: '#6366F1' } : null,
              buildEst > 0 ? { l: 'Builder Estimate', v: buildEst, cl: C.primary } : null,
              saleAmt > 0 ? { l: 'Sale Amount', v: saleAmt, cl: '#8B5CF6' } : null,
              saleAmt > 0 ? { l: 'Profit/Loss', v: profitLoss, cl: profitLoss >= 0 ? C.success : C.danger } : null,
              saleAmt > 0 ? { l: 'Margin %', v: null, cl: marginPct >= 0 ? C.success : C.danger } : null,
            ].filter(Boolean).map((it: any, i) => (
              <View key={i} style={{ width: '48%', backgroundColor: card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: border }}>
                <Text style={{ color: C.sub, fontSize: 11, fontWeight: '500' }}>{it.l}</Text>
                <Text style={{ color: it.cl, fontSize: 16, fontWeight: '700', marginTop: 4 }}>
                  {it.l === 'Margin %' ? `${marginPct.toFixed(1)}%` : fmt(it.v || 0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Material / Labor / Other */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[
            { l: 'Material', ic: '📦', v: sum.materialCost || 0, ac: C.primary },
            { l: 'Labor', ic: '👷', v: sum.laborCost || 0, ac: '#6C7A89' },
            { l: 'Other', ic: '📋', v: sum.otherCost || 0, ac: '#6366F1' },
          ].map((it, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: card, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: border, borderLeftWidth: 3, borderLeftColor: it.ac }}>
              <Text style={{ color: C.sub, fontSize: 11, fontWeight: '500' }}>{it.ic} {it.l}</Text>
              <Text style={{ color: txt, fontSize: 14, fontWeight: '700', marginTop: 4 }}>{fmt(it.v)}</Text>
            </View>
          ))}
        </View>

        {/* Cost per SQFT */}
        {sqftVal > 0 && (
          <View style={{ backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 16, marginTop: 16 }}>
            <Text style={{ color: txt, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Cost per SQFT Analysis</Text>
            {[
              { l: 'Total Cost/sqft', v: costPerSqft },
              { l: 'Material/sqft', v: matPerSqft },
              { l: 'Labor/sqft', v: labPerSqft },
            ].map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: border }}>
                <Text style={{ color: C.sub, fontSize: 14 }}>{it.l}</Text>
                <Text style={{ color: txt, fontSize: 14, fontWeight: '600' }}>{fmt(it.v)}</Text>
              </View>
            ))}
          </View>
        )}

        {sum.pendingPayments > 0 && (
          <Text style={{ color: C.warning, fontSize: 13, fontWeight: '600', marginTop: 12 }}>Pending Payments: {fmt(sum.pendingPayments)}</Text>
        )}

        {/* Add Expense */}
        <TouchableOpacity onPress={() => nav('addExpense', { preselectedSiteId: siteId })} style={{ backgroundColor: C.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>+ Add Expense</Text>
        </TouchableOpacity>

        {/* Edit Site */}
        <TouchableOpacity onPress={() => {
          setEditForm({ siteName: s.siteName || '', address: s.address || '', totalSqft: String(s.totalSqft || ''), customerRatePerSqft: String(s.customerRatePerSqft || ''), builderRatePerSqft: String(s.builderRatePerSqft || ''), saleAmount: String(s.saleAmount || ''), estimatedBudget: String(s.estimatedBudget || '') });
          setEditing(!editing);
        }} style={{ borderWidth: 1.5, borderColor: C.primary, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: C.primary, fontWeight: '700', fontSize: 15 }}>{editing ? 'Cancel Edit' : 'Edit Site'}</Text>
        </TouchableOpacity>

        {editing && (
          <View style={{ backgroundColor: card, padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: border }}>
            <TextInput placeholder="Site Name" value={editForm.siteName} onChangeText={(v: string) => setEditForm({ ...editForm, siteName: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Address" value={editForm.address} onChangeText={(v: string) => setEditForm({ ...editForm, address: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Total Sqft" value={editForm.totalSqft} onChangeText={(v: string) => setEditForm({ ...editForm, totalSqft: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput placeholder="Customer Rate/sqft" value={editForm.customerRatePerSqft} onChangeText={(v: string) => setEditForm({ ...editForm, customerRatePerSqft: v })} keyboardType="numeric" style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
              <TextInput placeholder="Builder Rate/sqft" value={editForm.builderRatePerSqft} onChangeText={(v: string) => setEditForm({ ...editForm, builderRatePerSqft: v })} keyboardType="numeric" style={[inpS(dark), { flex: 1 }]} placeholderTextColor={C.sub} />
            </View>
            <TextInput placeholder="Sale Amount" value={editForm.saleAmount} onChangeText={(v: string) => setEditForm({ ...editForm, saleAmount: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Estimated Budget" value={editForm.estimatedBudget} onChangeText={(v: string) => setEditForm({ ...editForm, estimatedBudget: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <TouchableOpacity onPress={saveEdit} style={{ backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Documents */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: txt }}>Documents</Text>
            <TouchableOpacity onPress={uploadDoc} disabled={uploading} style={{ backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{uploading ? 'Uploading...' : '+ Upload'}</Text>
            </TouchableOpacity>
          </View>
          {docs.length === 0 ? <Text style={{ color: C.sub, fontSize: 13 }}>No documents</Text> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {docs.map((d: any, i: number) => (
                <View key={d.id || i} style={{ marginRight: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: border }}>
                  <Image source={{ uri: d.url?.startsWith('/') ? `${API_HOST}${d.url}` : d.url }} style={{ width: 120, height: 90, borderRadius: 12 }} />
                  <TouchableOpacity onPress={() => deleteDoc(d.id)} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top Cost Items */}
        {topItems.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginBottom: 12 }}>Top Cost Items</Text>
            {topItems.slice(0, 5).map((item: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: card, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: border }}>
                <Text style={{ color: txt, fontSize: 14, fontWeight: '500' }}>{item.itemName}</Text>
                <Text style={{ color: C.primary, fontWeight: '700', fontSize: 14 }}>{fmt(item._sum?.totalAmount || item.totalAmount || 0)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Expenses */}
        {recentExpenses.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: txt, marginBottom: 12 }}>Recent Expenses</Text>
            {recentExpenses.slice(0, 8).map((exp: any) => (
              <View key={exp.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: card, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: txt, fontSize: 14, fontWeight: '600' }}>{exp.itemName}</Text>
                  <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{exp.expenseType} · {new Date(exp.expenseDate).toLocaleDateString('en-GB')}</Text>
                </View>
                <Text style={{ color: txt, fontSize: 15, fontWeight: '700' }}>{fmt(exp.totalAmount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Delete Site */}
        <TouchableOpacity onPress={deleteSite} style={{ borderWidth: 1.5, borderColor: C.danger, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 24, marginBottom: 20 }}>
          <Text style={{ color: C.danger, fontWeight: '700', fontSize: 15 }}>Delete Site</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
