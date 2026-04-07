import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { api } from '../api';
import { fmt, amtWords, C, inpS } from '../helpers';

const FACINGS = ['north', 'south', 'east', 'west', 'corner'];
const APPROVAL_TYPES = ['dtcp', 'cmda', 'municipality', 'panchayat', 'environmental', 'noc'];
const APPROVAL_STATUSES = ['pending', 'applied', 'approved', 'rejected', 'expired'];
const COST_CATEGORIES = ['road', 'drainage', 'electricity', 'water', 'survey', 'legal', 'marketing', 'brokerage', 'fencing', 'landscaping'];
const PAYMENT_TYPES = ['cash', 'upi', 'bank', 'cheque'];

const plotStatusColor: Record<string, string> = { available: '#00C853', booked: '#FFB300', sold: '#2196F3', cancelled: '#FF1744', reserved: '#9C27B0' };

export function LandDetailScreen({ landId, back, dark }: { landId: string; back: () => void; dark: boolean }) {
  const bg = dark ? C.bgDark : C.bg;
  const card = dark ? C.cardDark : C.card;
  const txt = dark ? C.textDark : C.text;
  const border = dark ? C.borderDark : C.border;
  const inputBg = dark ? C.inputBgDark : C.inputBg;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'plots' | 'approvals' | 'costs'>('plots');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [showBookPlot, setShowBookPlot] = useState<any>(null);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [showPayHistory, setShowPayHistory] = useState<any>(null);
  const [showAddApproval, setShowAddApproval] = useState(false);
  const [showAddCost, setShowAddCost] = useState(false);

  // Plot form
  const [plotForm, setPlotForm] = useState({ plotNumber: '', area: '', facing: '', ratePerSqft: '' });
  // Book form
  const [bookForm, setBookForm] = useState({ customerName: '', customerMobile: '', bookingAmount: '', ratePerSqft: '' });
  // Payment form
  const [payForm, setPayForm] = useState({ amount: '', paymentType: 'cash', description: '' });
  // Approval form
  const [appForm, setAppForm] = useState({ approvalType: 'dtcp', approvalNumber: '', status: 'pending', notes: '' });
  // Cost form
  const [costForm, setCostForm] = useState({ category: 'road', description: '', amount: '', vendorName: '', paymentStatus: 'paid' });

  const load = async () => {
    try {
      setError('');
      const r = await api.get(`/lands/${landId}`);
      setData(r.data?.data || {});
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addPlot = async () => {
    if (!plotForm.plotNumber.trim()) return Alert.alert('Error', 'Plot number required');
    setSubmitting(true);
    try {
      await api.post(`/lands/${landId}/plots`, { ...plotForm, area: parseFloat(plotForm.area) || 0, ratePerSqft: parseFloat(plotForm.ratePerSqft) || 0 });
      setShowAddPlot(false);
      setPlotForm({ plotNumber: '', area: '', facing: '', ratePerSqft: '' });
      load();
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const bookPlot = async () => {
    if (!showBookPlot) return;
    setSubmitting(true);
    try {
      await api.put(`/lands/${landId}/plots/${showBookPlot.id}`, {
        status: 'booked',
        customerName: bookForm.customerName,
        customerMobile: bookForm.customerMobile,
        bookingAmount: parseFloat(bookForm.bookingAmount) || 0,
        ratePerSqft: parseFloat(bookForm.ratePerSqft) || showBookPlot.ratePerSqft,
        bookingDate: new Date().toISOString(),
      });
      if (parseFloat(bookForm.bookingAmount) > 0) {
        await api.post(`/lands/${landId}/plots/${showBookPlot.id}/payments`, {
          amount: parseFloat(bookForm.bookingAmount),
          paymentType: 'cash',
          description: 'Booking advance',
          paymentDate: new Date().toISOString(),
        });
      }
      setShowBookPlot(null);
      setBookForm({ customerName: '', customerMobile: '', bookingAmount: '', ratePerSqft: '' });
      load();
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const recordPayment = async () => {
    if (!showPayment) return;
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) return Alert.alert('Enter amount');
    setSubmitting(true);
    try {
      await api.post(`/lands/${landId}/plots/${showPayment.id}/payments`, {
        amount: parseFloat(payForm.amount),
        paymentType: payForm.paymentType,
        description: payForm.description.trim() || undefined,
        paymentDate: new Date().toISOString(),
      });
      setShowPayment(null);
      setPayForm({ amount: '', paymentType: 'cash', description: '' });
      load();
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const addApproval = async () => {
    setSubmitting(true);
    try {
      await api.post(`/lands/${landId}/approvals`, appForm);
      setShowAddApproval(false);
      setAppForm({ approvalType: 'dtcp', approvalNumber: '', status: 'pending', notes: '' });
      load();
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const addCost = async () => {
    if (!costForm.amount || parseFloat(costForm.amount) <= 0) return Alert.alert('Enter amount');
    setSubmitting(true);
    try {
      await api.post(`/lands/${landId}/costs`, { ...costForm, amount: parseFloat(costForm.amount) || 0 });
      setShowAddCost(false);
      setCostForm({ category: 'road', description: '', amount: '', vendorName: '', paymentStatus: 'paid' });
      load();
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setSubmitting(false); }
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
  if (!data) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.sub }}>Land not found</Text></View>;

  const land = data.land || data;
  const plots = data.plots || [];
  const approvals = data.approvals || [];
  const devCosts = data.developmentCosts || [];
  const summary = data.summary || {};

  const purchCost = land.purchaseCost || 0;
  const expSaleVal = land.currentValue || summary.totalSaleValue || 0;
  const expProfit = summary.expectedProfit || (expSaleVal - purchCost);
  const totalInv = summary.totalInvestment || purchCost;
  const marginPct = expSaleVal > 0 ? Math.round(((expSaleVal - totalInv) / expSaleVal) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={back} style={{ marginBottom: 16 }}>
          <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        {/* Land Info */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: txt }}>{land.landName}</Text>
        <Text style={{ color: C.sub, marginTop: 4, fontSize: 13 }}>{land.landCode} · {land.totalArea} {land.areaUnit || 'sqft'} · {land.status}</Text>
        {land.city ? <Text style={{ color: C.sub, marginTop: 2, fontSize: 13 }}>📍 {land.city}{land.district ? `, ${land.district}` : ''}</Text> : null}
        {land.surveyNumber ? <Text style={{ color: C.sub, marginTop: 2, fontSize: 13 }}>S.No: {land.surveyNumber}</Text> : null}

        {/* Purchase vs Sale Banner */}
        {(purchCost > 0 || expSaleVal > 0) && (
          <View style={{ backgroundColor: C.primary + '08', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.primary + '20' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 12, alignItems: 'center' }}>
                <Text style={{ color: C.sub, fontSize: 10, fontWeight: '500' }}>PURCHASE COST</Text>
                <Text style={{ color: C.primary, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{fmt(purchCost)}</Text>
              </View>
              <View style={{ width: '48%', marginBottom: 12, alignItems: 'center' }}>
                <Text style={{ color: C.sub, fontSize: 10, fontWeight: '500' }}>EXPECTED SALE VALUE</Text>
                <Text style={{ color: '#8B5CF6', fontSize: 16, fontWeight: '700', marginTop: 2 }}>{fmt(expSaleVal)}</Text>
              </View>
              <View style={{ width: '48%', alignItems: 'center' }}>
                <Text style={{ color: C.sub, fontSize: 10, fontWeight: '500' }}>EXPECTED PROFIT</Text>
                <Text style={{ color: expProfit >= 0 ? C.success : C.danger, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{fmt(expProfit)}</Text>
                <Text style={{ color: C.sub, fontSize: 10, fontStyle: 'italic' }}>{amtWords(Math.abs(expProfit))}</Text>
              </View>
              <View style={{ width: '48%', alignItems: 'center' }}>
                <Text style={{ color: C.sub, fontSize: 10, fontWeight: '500' }}>MARGIN</Text>
                <Text style={{ color: marginPct >= 0 ? C.success : C.danger, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{marginPct}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Financial Summary Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {[
            { l: 'Total Investment', v: summary.totalInvestment || 0, cl: C.primary },
            { l: 'Total Sale Value', v: summary.totalSaleValue || expSaleVal, cl: '#8B5CF6' },
            { l: 'Collected', v: summary.totalCollected || 0, cl: C.success },
            { l: 'Profit', v: summary.actualProfit || 0, cl: (summary.actualProfit || 0) >= 0 ? C.success : C.danger },
          ].map((it, i) => (
            <View key={i} style={{ width: '48%', backgroundColor: card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: border }}>
              <Text style={{ color: C.sub, fontSize: 11, fontWeight: '500' }}>{it.l}</Text>
              <Text style={{ color: it.cl, fontSize: 16, fontWeight: '700', marginTop: 4 }}>{fmt(it.v)}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', marginTop: 24, marginBottom: 16, gap: 8 }}>
          {(['plots', 'approvals', 'costs'] as const).map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 10, borderRadius: 24, backgroundColor: activeTab === tab ? C.primary : inputBg, alignItems: 'center', borderWidth: 1, borderColor: activeTab === tab ? C.primary : border }}>
              <Text style={{ color: activeTab === tab ? '#fff' : txt, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PLOTS TAB */}
        {activeTab === 'plots' && (
          <View>
            <TouchableOpacity onPress={() => setShowAddPlot(true)} style={{ backgroundColor: C.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>+ Add Plot</Text>
            </TouchableOpacity>

            {plots.length === 0 ? (
              <Text style={{ color: C.sub, fontSize: 14, textAlign: 'center' }}>No plots yet</Text>
            ) : plots.map((plot: any) => (
              <View key={plot.id} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: txt, fontSize: 15, fontWeight: '600' }}>Plot {plot.plotNumber}</Text>
                  <View style={{ backgroundColor: (plotStatusColor[plot.status] || C.sub) + '18', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ color: plotStatusColor[plot.status] || C.sub, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{plot.status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                  {plot.area ? <Text style={{ color: C.sub, fontSize: 12 }}>{plot.area} sqft</Text> : null}
                  {plot.facing ? <Text style={{ color: C.sub, fontSize: 12, textTransform: 'capitalize' }}>{plot.facing}</Text> : null}
                  {plot.ratePerSqft ? <Text style={{ color: C.sub, fontSize: 12 }}>{fmt(plot.ratePerSqft)}/sqft</Text> : null}
                </View>
                {plot.customerName ? (
                  <Text style={{ color: txt, fontSize: 13, marginTop: 6 }}>👤 {plot.customerName}{plot.customerMobile ? ` · ${plot.customerMobile}` : ''}</Text>
                ) : null}
                {plot.totalValue ? (
                  <Text style={{ color: C.primary, fontSize: 14, fontWeight: '600', marginTop: 6 }}>Value: {fmt(plot.totalValue || (plot.area || 0) * (plot.ratePerSqft || 0))}</Text>
                ) : null}

                {/* Plot Actions */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {plot.status === 'available' && (
                    <TouchableOpacity onPress={() => { setBookForm({ customerName: '', customerMobile: '', bookingAmount: '', ratePerSqft: String(plot.ratePerSqft || '') }); setShowBookPlot(plot); }} style={{ flex: 1, backgroundColor: C.warning + '18', paddingVertical: 8, borderRadius: 20, alignItems: 'center' }}>
                      <Text style={{ color: C.warning, fontWeight: '600', fontSize: 12 }}>Book</Text>
                    </TouchableOpacity>
                  )}
                  {(plot.status === 'booked' || plot.status === 'sold') && (
                    <TouchableOpacity onPress={() => { setPayForm({ amount: '', paymentType: 'cash', description: '' }); setShowPayment(plot); }} style={{ flex: 1, backgroundColor: C.success + '18', paddingVertical: 8, borderRadius: 20, alignItems: 'center' }}>
                      <Text style={{ color: C.success, fontWeight: '600', fontSize: 12 }}>Pay</Text>
                    </TouchableOpacity>
                  )}
                  {plot.payments && plot.payments.length > 0 && (
                    <TouchableOpacity onPress={() => setShowPayHistory(plot)} style={{ flex: 1, backgroundColor: inputBg, paddingVertical: 8, borderRadius: 20, alignItems: 'center' }}>
                      <Text style={{ color: txt, fontWeight: '600', fontSize: 12 }}>History</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* APPROVALS TAB */}
        {activeTab === 'approvals' && (
          <View>
            <TouchableOpacity onPress={() => setShowAddApproval(true)} style={{ backgroundColor: C.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>+ Add Approval</Text>
            </TouchableOpacity>

            {approvals.length === 0 ? (
              <Text style={{ color: C.sub, fontSize: 14, textAlign: 'center' }}>No approvals yet</Text>
            ) : approvals.map((app: any, i: number) => {
              const appStatusColor: Record<string, string> = { approved: C.success, applied: '#2196F3', pending: C.warning, rejected: C.danger, expired: C.sub };
              return (
                <View key={app.id || i} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: txt, fontSize: 15, fontWeight: '600', textTransform: 'uppercase' }}>{app.approvalType}</Text>
                    <View style={{ backgroundColor: (appStatusColor[app.status] || C.sub) + '18', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
                      <Text style={{ color: appStatusColor[app.status] || C.sub, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{app.status}</Text>
                    </View>
                  </View>
                  {app.approvalNumber ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>No: {app.approvalNumber}</Text> : null}
                  {app.notes ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{app.notes}</Text> : null}
                </View>
              );
            })}
          </View>
        )}

        {/* COSTS TAB */}
        {activeTab === 'costs' && (
          <View>
            <TouchableOpacity onPress={() => setShowAddCost(true)} style={{ backgroundColor: C.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>+ Add Cost</Text>
            </TouchableOpacity>

            {devCosts.length === 0 ? (
              <Text style={{ color: C.sub, fontSize: 14, textAlign: 'center' }}>No development costs yet</Text>
            ) : devCosts.map((cost: any, i: number) => (
              <View key={cost.id || i} style={{ backgroundColor: card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: txt, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>{cost.category}</Text>
                  <Text style={{ color: C.primary, fontSize: 14, fontWeight: '700' }}>{fmt(cost.amount || 0)}</Text>
                </View>
                {cost.description ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{cost.description}</Text> : null}
                {cost.vendorName ? <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Vendor: {cost.vendorName}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ADD PLOT MODAL */}
      <Modal visible={showAddPlot} transparent animationType="slide" onRequestClose={() => setShowAddPlot(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Add Plot</Text>
            <TextInput placeholder="Plot Number *" value={plotForm.plotNumber} onChangeText={v => setPlotForm({ ...plotForm, plotNumber: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Area (sqft)" value={plotForm.area} onChangeText={v => setPlotForm({ ...plotForm, area: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Facing</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {FACINGS.map(f => (
                <TouchableOpacity key={f} onPress={() => setPlotForm({ ...plotForm, facing: f })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: plotForm.facing === f ? C.primary : inputBg, borderWidth: 1, borderColor: plotForm.facing === f ? C.primary : border }}>
                  <Text style={{ color: plotForm.facing === f ? '#fff' : txt, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput placeholder="Rate per sqft" value={plotForm.ratePerSqft} onChangeText={v => setPlotForm({ ...plotForm, ratePerSqft: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowAddPlot(false)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                <Text style={{ color: txt, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addPlot} disabled={submitting} style={{ flex: 1, backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{submitting ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOOK PLOT MODAL */}
      <Modal visible={!!showBookPlot} transparent animationType="slide" onRequestClose={() => setShowBookPlot(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Book Plot {showBookPlot?.plotNumber}</Text>
            <TextInput placeholder="Customer Name *" value={bookForm.customerName} onChangeText={v => setBookForm({ ...bookForm, customerName: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Customer Mobile" value={bookForm.customerMobile} onChangeText={v => setBookForm({ ...bookForm, customerMobile: v })} keyboardType="phone-pad" style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Booking Amount" value={bookForm.bookingAmount} onChangeText={v => setBookForm({ ...bookForm, bookingAmount: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Rate per sqft" value={bookForm.ratePerSqft} onChangeText={v => setBookForm({ ...bookForm, ratePerSqft: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowBookPlot(null)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                <Text style={{ color: txt, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={bookPlot} disabled={submitting} style={{ flex: 1, backgroundColor: C.warning, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{submitting ? 'Booking...' : 'Book'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal visible={!!showPayment} transparent animationType="slide" onRequestClose={() => setShowPayment(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Record Payment - Plot {showPayment?.plotNumber}</Text>
            <TextInput placeholder="Amount *" value={payForm.amount} onChangeText={v => setPayForm({ ...payForm, amount: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            {payForm.amount ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 8, fontStyle: 'italic' }}>{amtWords(parseFloat(payForm.amount) || 0)}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {PAYMENT_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setPayForm({ ...payForm, paymentType: t })} style={{ flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: payForm.paymentType === t ? C.primary : inputBg, alignItems: 'center', borderWidth: 1, borderColor: payForm.paymentType === t ? C.primary : border }}>
                  <Text style={{ color: payForm.paymentType === t ? '#fff' : txt, fontWeight: '600', fontSize: 11, textTransform: 'uppercase' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput placeholder="Description (optional)" value={payForm.description} onChangeText={v => setPayForm({ ...payForm, description: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowPayment(null)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                <Text style={{ color: txt, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={recordPayment} disabled={submitting} style={{ flex: 1, backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{submitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PAYMENT HISTORY MODAL */}
      <Modal visible={!!showPayHistory} transparent animationType="slide" onRequestClose={() => setShowPayHistory(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' }}>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Payment History - Plot {showPayHistory?.plotNumber}</Text>
            <ScrollView>
              {(showPayHistory?.payments || []).map((p: any, i: number) => (
                <View key={p.id || i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: border }}>
                  <View>
                    <Text style={{ color: txt, fontWeight: '600' }}>{fmt(p.amount)}</Text>
                    <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{p.paymentType} · {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-GB') : ''}</Text>
                    {p.description ? <Text style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{p.description}</Text> : null}
                  </View>
                  <Text style={{ color: C.success, fontWeight: '600', fontSize: 12, textTransform: 'uppercase' }}>{p.paymentType}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowPayHistory(null)} style={{ backgroundColor: inputBg, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: txt, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD APPROVAL MODAL */}
      <Modal visible={showAddApproval} transparent animationType="slide" onRequestClose={() => setShowAddApproval(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Add Approval</Text>
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {APPROVAL_TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setAppForm({ ...appForm, approvalType: t })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: appForm.approvalType === t ? C.primary : inputBg, borderWidth: 1, borderColor: appForm.approvalType === t ? C.primary : border }}>
                  <Text style={{ color: appForm.approvalType === t ? '#fff' : txt, fontWeight: '600', fontSize: 11, textTransform: 'uppercase' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput placeholder="Approval Number" value={appForm.approvalNumber} onChangeText={v => setAppForm({ ...appForm, approvalNumber: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {APPROVAL_STATUSES.map(s => (
                <TouchableOpacity key={s} onPress={() => setAppForm({ ...appForm, status: s })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: appForm.status === s ? C.primary : inputBg, borderWidth: 1, borderColor: appForm.status === s ? C.primary : border }}>
                  <Text style={{ color: appForm.status === s ? '#fff' : txt, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput placeholder="Notes" value={appForm.notes} onChangeText={v => setAppForm({ ...appForm, notes: v })} style={inpS(dark)} placeholderTextColor={C.sub} multiline />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowAddApproval(false)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                <Text style={{ color: txt, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addApproval} disabled={submitting} style={{ flex: 1, backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{submitting ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD COST MODAL */}
      <Modal visible={showAddCost} transparent animationType="slide" onRequestClose={() => setShowAddCost(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: txt, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Add Development Cost</Text>
            <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {COST_CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setCostForm({ ...costForm, category: c })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: costForm.category === c ? C.primary : inputBg, borderWidth: 1, borderColor: costForm.category === c ? C.primary : border }}>
                  <Text style={{ color: costForm.category === c ? '#fff' : txt, fontWeight: '600', fontSize: 12, textTransform: 'capitalize' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput placeholder="Description" value={costForm.description} onChangeText={v => setCostForm({ ...costForm, description: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Amount *" value={costForm.amount} onChangeText={v => setCostForm({ ...costForm, amount: v })} keyboardType="numeric" style={inpS(dark)} placeholderTextColor={C.sub} />
            <TextInput placeholder="Vendor Name" value={costForm.vendorName} onChangeText={v => setCostForm({ ...costForm, vendorName: v })} style={inpS(dark)} placeholderTextColor={C.sub} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowAddCost(false)} style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
                <Text style={{ color: txt, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addCost} disabled={submitting} style={{ flex: 1, backgroundColor: C.success, padding: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{submitting ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
