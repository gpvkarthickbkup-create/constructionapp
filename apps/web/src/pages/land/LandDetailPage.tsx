import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatCurrency, formatDate, cn, amountToWords } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Layers,
  MapPin,
  ShieldCheck,
  Loader2,
  Trash2,
  X,
  Check,
  Receipt,
  Landmark,
  HardHat,
} from 'lucide-react';

const PLOT_STATUSES = ['available', 'booked', 'sold', 'cancelled', 'reserved'];
const FACINGS = ['north', 'south', 'east', 'west', 'corner'];
const APPROVAL_TYPES = ['dtcp', 'cmda', 'municipality', 'panchayat', 'environmental', 'noc'];
const APPROVAL_STATUSES = ['pending', 'applied', 'approved', 'rejected', 'expired'];
const COST_CATEGORIES = ['road', 'drainage', 'electricity', 'water', 'survey', 'legal', 'marketing', 'brokerage', 'registration', 'fencing', 'landscaping', 'other'];
const PAYMENT_TYPES = ['cash', 'upi', 'bank', 'cheque'];

const statusColor = (s: string) => {
  switch (s) {
    case 'available': return 'bg-green-100 text-green-700 border-green-200';
    case 'booked': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'sold': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'reserved': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const approvalBadge = (s: string) => {
  switch (s) {
    case 'approved': return 'success' as const;
    case 'applied': return 'info' as const;
    case 'pending': return 'warning' as const;
    case 'rejected': return 'destructive' as const;
    case 'expired': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

export default function LandDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plots' | 'approvals' | 'costs'>('plots');

  // Modals
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [showBookPlot, setShowBookPlot] = useState<any>(null);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState<any>(null);
  const [showAddApproval, setShowAddApproval] = useState(false);
  const [showAddCost, setShowAddCost] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lands/${id}`);
      setData(res.data.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Plot form
  const [plotForm, setPlotForm] = useState({ plotNumber: '', area: '', facing: '', ratePerSqft: '', notes: '' });

  const addPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotForm.plotNumber.trim()) { toast.error('Plot number is required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/lands/${id}/plots`, plotForm);
      toast.success('Plot added');
      setShowAddPlot(false);
      setPlotForm({ plotNumber: '', area: '', facing: '', ratePerSqft: '', notes: '' });
      fetchData();
    } catch { toast.error(t('common.error')); }
    finally { setSubmitting(false); }
  };

  // Book plot form
  const [bookForm, setBookForm] = useState({ customerName: '', customerMobile: '', bookingAmount: '', ratePerSqft: '' });

  const bookPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBookPlot) return;
    setSubmitting(true);
    try {
      await api.put(`/lands/${id}/plots/${showBookPlot.id}`, {
        status: 'booked',
        customerName: bookForm.customerName,
        customerMobile: bookForm.customerMobile,
        bookingAmount: parseFloat(bookForm.bookingAmount) || 0,
        ratePerSqft: parseFloat(bookForm.ratePerSqft) || showBookPlot.ratePerSqft,
        bookingDate: new Date().toISOString(),
      });
      // Record booking payment if amount > 0
      if (parseFloat(bookForm.bookingAmount) > 0) {
        await api.post(`/lands/${id}/plots/${showBookPlot.id}/payments`, {
          amount: parseFloat(bookForm.bookingAmount),
          paymentType: 'cash',
          description: 'Booking advance',
          paymentDate: new Date().toISOString(),
        });
      }
      toast.success('Plot booked successfully');
      setShowBookPlot(null);
      setBookForm({ customerName: '', customerMobile: '', bookingAmount: '', ratePerSqft: '' });
      fetchData();
    } catch { toast.error(t('common.error')); }
    finally { setSubmitting(false); }
  };

  // Payment form
  const [payForm, setPayForm] = useState({ amount: '', paymentType: 'cash', description: '', reference: '' });

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayment) return;
    setSubmitting(true);
    try {
      await api.post(`/lands/${id}/plots/${showPayment.id}/payments`, {
        ...payForm,
        amount: parseFloat(payForm.amount) || 0,
        paymentDate: new Date().toISOString(),
      });
      toast.success('Payment recorded');
      setShowPayment(null);
      setPayForm({ amount: '', paymentType: 'cash', description: '', reference: '' });
      fetchData();
    } catch { toast.error(t('common.error')); }
    finally { setSubmitting(false); }
  };

  // Approval form
  const [appForm, setAppForm] = useState({ approvalType: 'dtcp', approvalNumber: '', status: 'pending', notes: '' });

  const addApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/lands/${id}/approvals`, appForm);
      toast.success('Approval added');
      setShowAddApproval(false);
      setAppForm({ approvalType: 'dtcp', approvalNumber: '', status: 'pending', notes: '' });
      fetchData();
    } catch { toast.error(t('common.error')); }
    finally { setSubmitting(false); }
  };

  // Cost form
  const [costForm, setCostForm] = useState({ category: 'road', description: '', amount: '', vendorName: '', date: '', paymentStatus: 'paid' });

  const addCost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/lands/${id}/costs`, { ...costForm, amount: parseFloat(costForm.amount) || 0 });
      toast.success('Development cost added');
      setShowAddCost(false);
      setCostForm({ category: 'road', description: '', amount: '', vendorName: '', date: '', paymentStatus: 'paid' });
      fetchData();
    } catch { toast.error(t('common.error')); }
    finally { setSubmitting(false); }
  };

  const deletePlot = async (plotId: string) => {
    if (!confirm('Delete this plot? All payments will also be deleted.')) return;
    try {
      await api.delete(`/lands/${id}/plots/${plotId}`);
      toast.success('Plot deleted');
      fetchData();
    } catch { toast.error(t('common.error')); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f26f31]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Land not found</p>
        <Button onClick={() => navigate('/app/lands')} variant="outline" className="mt-4">Go Back</Button>
      </div>
    );
  }

  const { land, plots, approvals, developmentCosts, summary } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/lands')} className="rounded-xl mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{land.landName}</h1>
              <Badge variant="outline" className="font-mono text-xs">{land.landCode}</Badge>
              <Badge variant={land.status === 'selling' ? 'info' : land.status === 'sold_out' ? 'success' : 'secondary'}>
                {land.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              {land.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{land.city}{land.district ? `, ${land.district}` : ''}</span>}
              <span>{land.totalArea} {land.areaUnit}</span>
              {land.surveyNumber && <span>S.No: {land.surveyNumber}</span>}
              <span>{t('land.purchaseCost')}: {formatCurrency(land.purchaseCost)}</span>
              <Badge variant={land.dtcpStatus === 'approved' ? 'success' : land.dtcpStatus === 'pending' ? 'warning' : 'secondary'}>
                DTCP: {land.dtcpStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase vs Sale Highlight */}
      {(land.purchaseCost > 0 || land.currentValue > 0) && (
        <Card className="shadow-md border-0 bg-gradient-to-r from-[#f26f31]/5 to-purple-50">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">💰 Purchase Cost</p>
                <p className="text-2xl font-bold text-[#f26f31]">{formatCurrency(land.purchaseCost || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">📈 Expected Sale Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(land.currentValue || summary.totalSaleValue || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">📊 Expected Profit</p>
                <p className={`text-2xl font-bold ${(summary.expectedProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.expectedProfit || (land.currentValue || 0) - (land.purchaseCost || 0))}
                </p>
                <p className="text-xs text-muted-foreground italic">{amountToWords(Math.abs(summary.expectedProfit || (land.currentValue || 0) - (land.purchaseCost || 0)))}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase">📋 Margin</p>
                {(() => {
                  const sv = land.currentValue || summary.totalSaleValue || 0;
                  const margin = sv > 0 ? Math.round(((sv - (summary.totalInvestment || land.purchaseCost || 0)) / sv) * 100) : 0;
                  return <p className={`text-3xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{margin}%</p>;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <HardHat className="h-4 w-4 text-[#f26f31]" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('land.totalInvestment')}</p>
            </div>
            <p className="text-xl font-bold text-[#f26f31]">{formatCurrency(summary.totalInvestment)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Purchase: {formatCurrency(summary.purchaseCost)}
            </p>
            <p className="text-xs text-muted-foreground">
              Dev: {formatCurrency(summary.developmentCost)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sale Value</p>
            </div>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(summary.totalSaleValue || land.currentValue || 0)}</p>
            {land.currentValue > 0 && <p className="text-xs text-muted-foreground mt-1">Expected: {formatCurrency(land.currentValue)}</p>}
            {summary.totalSaleValue > 0 && <p className="text-xs text-muted-foreground">From plots: {formatCurrency(summary.totalSaleValue)}</p>}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-green-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Collected</p>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalCollected)}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending: {formatCurrency(summary.totalPending)}</p>
          </CardContent>
        </Card>
        <Card className={cn('shadow-sm border-0', summary.actualProfit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-gradient-to-br from-red-50 to-rose-50')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {summary.actualProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit / Loss</p>
            </div>
            <p className={cn('text-xl font-bold', summary.actualProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {summary.actualProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(summary.actualProfit))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 italic">{amountToWords(Math.abs(summary.actualProfit))}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-cyan-50 to-sky-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Potential Profit</p>
            </div>
            <p className={cn('text-xl font-bold', summary.potentialProfit >= 0 ? 'text-cyan-600' : 'text-red-600')}>
              {summary.potentialProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(summary.potentialProfit))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">If all plots sold</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin & Plots</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{summary.profitMargin}%</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-green-600">{summary.availablePlots} Avail</span>
              <span className="text-amber-600">{summary.bookedPlots} Booked</span>
              <span className="text-blue-600">{summary.soldPlots} Sold</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
        {(['plots', 'approvals', 'costs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-gray-800 shadow-sm text-[#f26f31]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'plots' ? t('land.plots') : tab === 'approvals' ? t('land.approvals') : t('land.developmentCosts')}
            {tab === 'plots' && <span className="ml-1.5 text-xs bg-[#f26f31]/10 text-[#f26f31] px-1.5 py-0.5 rounded-full">{plots.length}</span>}
          </button>
        ))}
      </div>

      {/* PLOTS TAB */}
      {activeTab === 'plots' && (
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">{t('land.plots')}</CardTitle>
            <Button size="sm" onClick={() => setShowAddPlot(true)} className="bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
              <Plus className="h-4 w-4 mr-1" /> {t('land.addPlot')}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {plots.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No plots added yet. Click "Add Plot" to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t('land.plotNumber')}</th>
                      <th className="text-left p-3 font-medium">Area (sqft)</th>
                      <th className="text-left p-3 font-medium">{t('land.facing')}</th>
                      <th className="text-right p-3 font-medium">Rate/sqft</th>
                      <th className="text-right p-3 font-medium">Total Price</th>
                      <th className="text-right p-3 font-medium">Collected</th>
                      <th className="text-right p-3 font-medium">Pending</th>
                      <th className="text-center p-3 font-medium">{t('common.status')}</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-center p-3 font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plots.map((plot: any) => {
                      const collected = (plot.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
                      const pending = (plot.salePrice || plot.totalPrice) - collected;
                      return (
                        <tr key={plot.id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-semibold">{plot.plotNumber}</td>
                          <td className="p-3">{plot.area}</td>
                          <td className="p-3 capitalize">{plot.facing || '-'}</td>
                          <td className="p-3 text-right">{formatCurrency(plot.ratePerSqft)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(plot.salePrice || plot.totalPrice)}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(collected)}</td>
                          <td className="p-3 text-right text-amber-600">{formatCurrency(Math.max(0, pending))}</td>
                          <td className="p-3 text-center">
                            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', statusColor(plot.status))}>
                              {plot.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm">
                            {plot.customerName ? (
                              <div>
                                <div className="font-medium">{plot.customerName}</div>
                                {plot.customerMobile && <div className="text-xs text-muted-foreground">{plot.customerMobile}</div>}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {plot.status === 'available' && (
                                <button
                                  onClick={() => { setShowBookPlot(plot); setBookForm({ customerName: '', customerMobile: '', bookingAmount: '', ratePerSqft: String(plot.ratePerSqft) }); }}
                                  className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium"
                                >
                                  {t('land.bookPlot')}
                                </button>
                              )}
                              {(plot.status === 'booked' || plot.status === 'sold') && (
                                <button
                                  onClick={() => { setShowPayment(plot); setPayForm({ amount: '', paymentType: 'cash', description: '', reference: '' }); }}
                                  className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                                >
                                  {t('land.recordPayment')}
                                </button>
                              )}
                              {plot.payments && plot.payments.length > 0 && (
                                <button
                                  onClick={() => setShowPaymentHistory(plot)}
                                  className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
                                >
                                  <Receipt className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => deletePlot(plot.id)}
                                className="text-xs px-1.5 py-1 rounded-lg text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">{t('land.approvals')}</CardTitle>
            <Button size="sm" onClick={() => setShowAddApproval(true)} className="bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
              <Plus className="h-4 w-4 mr-1" /> Add Approval
            </Button>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No approvals recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {approvals.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-[#f26f31]" />
                      <div>
                        <p className="font-semibold uppercase text-sm">{app.approvalType}</p>
                        {app.approvalNumber && <p className="text-xs text-muted-foreground">#{app.approvalNumber}</p>}
                        {app.notes && <p className="text-xs text-muted-foreground mt-0.5">{app.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.approvedDate && <span className="text-xs text-muted-foreground">{formatDate(app.approvedDate)}</span>}
                      <Badge variant={approvalBadge(app.status)}>{app.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DEVELOPMENT COSTS TAB */}
      {activeTab === 'costs' && (
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">{t('land.developmentCosts')}</CardTitle>
            <Button size="sm" onClick={() => setShowAddCost(true)} className="bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
              <Plus className="h-4 w-4 mr-1" /> Add Cost
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {developmentCosts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No development costs recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t('common.category')}</th>
                      <th className="text-left p-3 font-medium">{t('common.description')}</th>
                      <th className="text-right p-3 font-medium">{t('common.amount')}</th>
                      <th className="text-left p-3 font-medium">Vendor</th>
                      <th className="text-left p-3 font-medium">{t('common.date')}</th>
                      <th className="text-center p-3 font-medium">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {developmentCosts.map((cost: any) => (
                      <tr key={cost.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="p-3 capitalize font-medium">{cost.category}</td>
                        <td className="p-3">{cost.description || '-'}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(cost.amount)}</td>
                        <td className="p-3">{cost.vendorName || '-'}</td>
                        <td className="p-3">{cost.date ? formatDate(cost.date) : '-'}</td>
                        <td className="p-3 text-center">
                          <Badge variant={cost.paymentStatus === 'paid' ? 'success' : 'warning'}>{cost.paymentStatus}</Badge>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/30 font-bold">
                      <td className="p-3" colSpan={2}>Total Development Cost</td>
                      <td className="p-3 text-right text-[#f26f31]">{formatCurrency(summary.totalDevelopmentCost)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======== MODALS ======== */}

      {/* Add Plot Modal */}
      {showAddPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddPlot(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('land.addPlot')}</h3>
              <button onClick={() => setShowAddPlot(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addPlot} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('land.plotNumber')} *</label>
                <Input value={plotForm.plotNumber} onChange={e => setPlotForm({ ...plotForm, plotNumber: e.target.value })} placeholder="e.g., A1, B2" className="rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Area (sqft)</label>
                  <Input type="number" step="0.01" value={plotForm.area} onChange={e => setPlotForm({ ...plotForm, area: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Rate/sqft</label>
                  <Input type="number" step="0.01" value={plotForm.ratePerSqft} onChange={e => setPlotForm({ ...plotForm, ratePerSqft: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('land.facing')}</label>
                <select value={plotForm.facing} onChange={e => setPlotForm({ ...plotForm, facing: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">Select</option>
                  {FACINGS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              {plotForm.area && plotForm.ratePerSqft && (
                <div className="rounded-xl bg-orange-50 p-3 text-sm">
                  <span className="text-muted-foreground">Total Price: </span>
                  <span className="font-bold text-[#f26f31]">{formatCurrency(parseFloat(plotForm.area) * parseFloat(plotForm.ratePerSqft))}</span>
                </div>
              )}
              <Button type="submit" disabled={submitting} className="w-full bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                {t('land.addPlot')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Book Plot Modal */}
      {showBookPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBookPlot(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('land.bookPlot')} - {showBookPlot.plotNumber}</h3>
              <button onClick={() => setShowBookPlot(null)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={bookPlot} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Customer Name *</label>
                <Input value={bookForm.customerName} onChange={e => setBookForm({ ...bookForm, customerName: e.target.value })} placeholder="Enter customer name" className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mobile</label>
                <Input value={bookForm.customerMobile} onChange={e => setBookForm({ ...bookForm, customerMobile: e.target.value })} placeholder="Enter mobile number" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Rate/sqft</label>
                  <Input type="number" step="0.01" value={bookForm.ratePerSqft} onChange={e => setBookForm({ ...bookForm, ratePerSqft: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Booking Amount</label>
                  <Input type="number" step="0.01" value={bookForm.bookingAmount} onChange={e => setBookForm({ ...bookForm, bookingAmount: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 text-sm">
                <span className="text-muted-foreground">Plot: </span>
                <span className="font-medium">{showBookPlot.area} sqft</span>
                <span className="text-muted-foreground ml-2">Total: </span>
                <span className="font-bold text-[#f26f31]">{formatCurrency(showBookPlot.area * (parseFloat(bookForm.ratePerSqft) || showBookPlot.ratePerSqft))}</span>
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                {t('land.bookPlot')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPayment(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('land.recordPayment')} - {showPayment.plotNumber}</h3>
              <button onClick={() => setShowPayment(null)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={recordPayment} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.amount')} *</label>
                <Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="Enter amount" className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Payment Type</label>
                <select value={payForm.paymentType} onChange={e => setPayForm({ ...payForm, paymentType: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {PAYMENT_TYPES.map(pt => <option key={pt} value={pt}>{pt.charAt(0).toUpperCase() + pt.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.description')}</label>
                <Input value={payForm.description} onChange={e => setPayForm({ ...payForm, description: e.target.value })} placeholder="e.g., 1st installment" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reference / UTR</label>
                <Input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Transaction reference" className="rounded-xl" />
              </div>
              {(() => {
                const collected = (showPayment.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
                const total = showPayment.salePrice || showPayment.totalPrice;
                return (
                  <div className="rounded-xl bg-orange-50 p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Price</span><span className="font-medium">{formatCurrency(total)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Collected</span><span className="font-medium text-green-600">{formatCurrency(collected)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-bold text-amber-600">{formatCurrency(Math.max(0, total - collected))}</span></div>
                  </div>
                );
              })()}
              <Button type="submit" disabled={submitting} className="w-full bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                {t('land.recordPayment')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPaymentHistory(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Payment History - Plot {showPaymentHistory.plotNumber}</h3>
              <button onClick={() => setShowPaymentHistory(null)}><X className="h-5 w-5" /></button>
            </div>
            {showPaymentHistory.customerName && (
              <p className="text-sm text-muted-foreground mb-3">Customer: <span className="font-medium text-foreground">{showPaymentHistory.customerName}</span></p>
            )}
            <div className="space-y-2">
              {(showPaymentHistory.payments || []).map((pay: any, idx: number) => (
                <div key={pay.id || idx} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                  <div>
                    <p className="font-semibold text-sm">{formatCurrency(pay.amount)}</p>
                    <p className="text-xs text-muted-foreground">{pay.description || `Installment #${pay.installmentNo}`}</p>
                    {pay.reference && <p className="text-xs text-muted-foreground">Ref: {pay.reference}</p>}
                    {pay.receiptNumber && <p className="text-xs text-muted-foreground">Receipt: {pay.receiptNumber}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{formatDate(pay.paymentDate)}</p>
                    <Badge variant="outline" className="text-xs capitalize mt-1">{pay.paymentType}</Badge>
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const collected = (showPaymentHistory.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
              const total = showPaymentHistory.salePrice || showPaymentHistory.totalPrice;
              return (
                <div className="mt-4 rounded-xl bg-orange-50 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Total Price</span><span className="font-medium">{formatCurrency(total)}</span></div>
                  <div className="flex justify-between"><span>Total Collected</span><span className="font-bold text-green-600">{formatCurrency(collected)}</span></div>
                  <div className="flex justify-between"><span>Balance</span><span className="font-bold text-amber-600">{formatCurrency(Math.max(0, total - collected))}</span></div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Approval Modal */}
      {showAddApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddApproval(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Approval</h3>
              <button onClick={() => setShowAddApproval(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addApproval} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Approval Type *</label>
                <select value={appForm.approvalType} onChange={e => setAppForm({ ...appForm, approvalType: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {APPROVAL_TYPES.map(at => <option key={at} value={at}>{at.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Approval Number</label>
                <Input value={appForm.approvalNumber} onChange={e => setAppForm({ ...appForm, approvalNumber: e.target.value })} placeholder="e.g., DTCP/2024/1234" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.status')}</label>
                <select value={appForm.status} onChange={e => setAppForm({ ...appForm, status: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.notes')}</label>
                <Input value={appForm.notes} onChange={e => setAppForm({ ...appForm, notes: e.target.value })} placeholder="Notes..." className="rounded-xl" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Add Approval
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Add Development Cost Modal */}
      {showAddCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddCost(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Development Cost</h3>
              <button onClick={() => setShowAddCost(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addCost} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.category')} *</label>
                <select value={costForm.category} onChange={e => setCostForm({ ...costForm, category: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {COST_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.description')}</label>
                <Input value={costForm.description} onChange={e => setCostForm({ ...costForm, description: e.target.value })} placeholder="Description" className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('common.amount')} *</label>
                <Input type="number" step="0.01" value={costForm.amount} onChange={e => setCostForm({ ...costForm, amount: e.target.value })} placeholder="0" className="rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Vendor Name</label>
                <Input value={costForm.vendorName} onChange={e => setCostForm({ ...costForm, vendorName: e.target.value })} placeholder="Vendor / Contractor" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('common.date')}</label>
                  <Input type="date" value={costForm.date} onChange={e => setCostForm({ ...costForm, date: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('common.status')}</label>
                  <select value={costForm.paymentStatus} onChange={e => setCostForm({ ...costForm, paymentStatus: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-[#f26f31] hover:bg-[#c9531a] rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Add Cost
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
