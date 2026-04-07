import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  X,
  Landmark,
  Wallet,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  Printer,
  Loader2,
  Banknote,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

interface BankAccount {
  id: string;
  accountName: string;
  accountType: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  balance: number;
  lastTransaction?: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  description: string;
  reference: string;
  category?: string;
  balance: number;
}

interface BankSummary {
  accounts: number;
  totalBalance: number;
  bankBalance: number;
  cashBalance: number;
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLakh = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLakh(n % 100) : '');
    if (n < 100000) return convertLakh(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertLakh(n % 1000) : '');
    if (n < 10000000) return convertLakh(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertLakh(n % 100000) : '');
    return convertLakh(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertLakh(n % 10000000) : '');
  };

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);
  let result = (num < 0 ? 'Minus ' : '') + convertLakh(intPart) + ' Rupees';
  if (decPart > 0) result += ' and ' + convertLakh(decPart) + ' Paise';
  return result + ' Only';
}

const accountTypeIcon = (type: string) => {
  switch (type) {
    case 'bank': return <Landmark className="h-5 w-5 text-blue-600" />;
    case 'cash': return <Banknote className="h-5 w-5 text-green-600" />;
    case 'upi': return <Smartphone className="h-5 w-5 text-purple-600" />;
    default: return <Wallet className="h-5 w-5 text-gray-600" />;
  }
};

const accountTypeColor = (type: string) => {
  switch (type) {
    case 'bank': return 'bg-blue-50 border-blue-200';
    case 'cash': return 'bg-green-50 border-green-200';
    case 'upi': return 'bg-purple-50 border-purple-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

export default function BankPage() {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [summary, setSummary] = useState<BankSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected account detail
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Add account form
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountType: 'bank',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    balance: '',
  });

  // Add transaction form
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [submittingTxn, setSubmittingTxn] = useState(false);
  const [txnForm, setTxnForm] = useState({
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    category: '',
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [accRes, sumRes] = await Promise.all([
        api.get('/bank/accounts'),
        api.get('/bank/summary'),
      ]);
      const accData = accRes.data.data || accRes.data || [];
      setAccounts(Array.isArray(accData) ? accData : []);
      const sumData = sumRes.data.data || sumRes.data;
      setSummary(sumData);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountDetail = async (account: BankAccount) => {
    try {
      setLoadingTxns(true);
      setSelectedAccount(account);
      const res = await api.get(`/bank/accounts/${account.id}`);
      const data = res.data.data || res.data;
      setTransactions(data.transactions || []);
      if (data.account) {
        setSelectedAccount(data.account);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoadingTxns(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.accountName) {
      toast.error(t('common.requiredFields'));
      return;
    }
    try {
      setSubmittingAccount(true);
      await api.post('/bank/accounts', {
        ...accountForm,
        balance: parseFloat(accountForm.balance) || 0,
      });
      toast.success(t('bank.accountCreated'));
      setAccountForm({ accountName: '', accountType: 'bank', bankName: '', accountNumber: '', ifscCode: '', balance: '' });
      setShowAddAccount(false);
      fetchAccounts();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnForm.amount || !txnForm.description || !selectedAccount) {
      toast.error(t('common.requiredFields'));
      return;
    }
    try {
      setSubmittingTxn(true);
      await api.post('/bank/transactions', {
        accountId: selectedAccount.id,
        ...txnForm,
        amount: parseFloat(txnForm.amount),
      });
      toast.success(t('bank.transactionRecorded'));
      setTxnForm({ type: 'credit', amount: '', date: new Date().toISOString().split('T')[0], description: '', reference: '', category: '' });
      setShowAddTxn(false);
      fetchAccountDetail(selectedAccount);
      fetchAccounts();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmittingTxn(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${selectedAccount?.accountName || 'Bank'} - Transactions</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f26f31; color: white; }
        .credit { color: #16a34a; }
        .debit { color: #dc2626; }
        h2 { color: #f26f31; }
        .balance-words { font-style: italic; color: #666; margin-top: 12px; font-size: 13px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ---- ACCOUNT DETAIL VIEW ----
  if (selectedAccount) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Back button + header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedAccount(null); setTransactions([]); }}
              className="h-10 w-10 rounded-xl p-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accountTypeColor(selectedAccount.accountType)}`}>
                {accountTypeIcon(selectedAccount.accountType)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selectedAccount.accountName}</h1>
                <p className="text-sm text-[#ACA9A9]">
                  {selectedAccount.bankName && `${selectedAccount.bankName} - `}
                  {selectedAccount.accountNumber && `A/C: ${selectedAccount.accountNumber}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-12 px-4 rounded-xl border-gray-200"
            >
              <Printer className="mr-2 h-4 w-4" />
              {t('common.print')}
            </Button>
            <Button
              onClick={() => setShowAddTxn(true)}
              className="bg-[#f26f31] hover:bg-[#f26f31]/90 text-white shadow-lg shadow-[#f26f31]/20 h-12 px-6 text-base font-semibold rounded-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('bank.addTransaction')}
            </Button>
          </div>
        </div>

        {/* Balance card */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 bg-[#f26f31]" />
          <CardContent className="p-6">
            <p className="text-sm text-[#ACA9A9] mb-1">{t('bank.balance')}</p>
            <p className={`text-3xl font-bold ${selectedAccount.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(selectedAccount.balance)}
            </p>
            <p className="text-xs text-gray-400 mt-2 italic">{numberToWords(selectedAccount.balance)}</p>
          </CardContent>
        </Card>

        {/* Add Transaction Modal */}
        {showAddTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-[#f26f31]" />
                    {t('bank.addTransaction')}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddTxn(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  {/* Type toggle */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">{t('common.type')}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTxnForm({ ...txnForm, type: 'credit' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          txnForm.type === 'credit'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        {t('bank.credit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxnForm({ ...txnForm, type: 'debit' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          txnForm.type === 'debit'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <ArrowDownRight className="h-4 w-4" />
                        {t('bank.debit')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('common.amount')} *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={txnForm.amount}
                      onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                      className="h-12 text-base rounded-xl"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('common.date')} *</label>
                    <Input
                      type="date"
                      value={txnForm.date}
                      onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })}
                      className="h-12 text-base rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.description')} *</label>
                    <Input
                      value={txnForm.description}
                      onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
                      className="h-12 text-base rounded-xl"
                      placeholder={t('bank.description')}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.reference')}</label>
                    <Input
                      value={txnForm.reference}
                      onChange={(e) => setTxnForm({ ...txnForm, reference: e.target.value })}
                      className="h-12 text-base rounded-xl"
                      placeholder="e.g., UTR / Txn ID"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingTxn}
                    className="w-full bg-[#f26f31] hover:bg-[#f26f31]/90 text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-[#f26f31]/20"
                  >
                    {submittingTxn ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-5 w-5" />
                    )}
                    {t('bank.addTransaction')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction table (printable) */}
        <div ref={printRef}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedAccount.accountName} - {t('bank.transactions')}</h2>
          {selectedAccount.bankName && <p className="text-sm text-gray-500 mb-4">{selectedAccount.bankName} | A/C: {selectedAccount.accountNumber}</p>}

          {loadingTxns ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f26f31]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-4">
                <TrendingUp className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('bank.noTransactions')}</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f26f31] text-white">
                      <th className="text-left py-3 px-4 font-semibold">{t('common.date')}</th>
                      <th className="text-left py-3 px-4 font-semibold">{t('bank.description')}</th>
                      <th className="text-left py-3 px-4 font-semibold">{t('bank.reference')}</th>
                      <th className="text-right py-3 px-4 font-semibold">{t('bank.credit')}</th>
                      <th className="text-right py-3 px-4 font-semibold">{t('bank.debit')}</th>
                      <th className="text-right py-3 px-4 font-semibold">{t('bank.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn, idx) => (
                      <tr key={txn.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                          {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{txn.description}</td>
                        <td className="py-3 px-4 text-gray-500">{txn.reference || '-'}</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">
                          {txn.type === 'credit' ? formatCurrency(txn.amount) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 font-semibold">
                          {txn.type === 'debit' ? formatCurrency(txn.amount) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${txn.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          {formatCurrency(txn.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="balance-words text-xs text-gray-400 mt-3 italic">
                {t('bank.balance')}: {numberToWords(selectedAccount.balance)}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- ACCOUNTS LIST VIEW ----
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f26f31]/10">
            <Landmark className="h-5 w-5 text-[#f26f31]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('bank.title')}</h1>
            <p className="text-sm text-[#ACA9A9]">{t('bank.accounts')}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddAccount(true)}
          className="bg-[#f26f31] hover:bg-[#f26f31]/90 text-white shadow-lg shadow-[#f26f31]/20 h-12 px-6 text-base font-semibold rounded-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('bank.addAccount')}
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-[#f26f31]" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f26f31]/10">
                  <span className="text-2xl">🏦</span>
                </div>
                <div>
                  <p className="text-sm text-[#ACA9A9]">{t('bank.totalBalance')}</p>
                  <p className={`text-2xl font-bold ${summary.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.totalBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <span className="text-2xl">💵</span>
                </div>
                <div>
                  <p className="text-sm text-[#ACA9A9]">{t('bank.bankBalance')}</p>
                  <p className={`text-2xl font-bold ${summary.bankBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.bankBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-green-500" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <p className="text-sm text-[#ACA9A9]">{t('bank.cashBalance')}</p>
                  <p className={`text-2xl font-bold ${summary.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.cashBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg border-0 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-[#f26f31]" />
                  {t('bank.addAccount')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAddAccount(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.accountName')} *</label>
                  <Input
                    value={accountForm.accountName}
                    onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder={t('bank.accountName')}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.accountType')} *</label>
                  <select
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                    className="w-full h-12 text-base rounded-xl border border-gray-200 px-3 focus:outline-none focus:ring-2 focus:ring-[#f26f31]/20 focus:border-[#f26f31]"
                  >
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                {accountForm.accountType === 'bank' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.bankName')}</label>
                      <Input
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                        className="h-12 text-base rounded-xl"
                        placeholder={t('bank.bankName')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.accountNumber')}</label>
                      <Input
                        value={accountForm.accountNumber}
                        onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                        className="h-12 text-base rounded-xl"
                        placeholder={t('bank.accountNumber')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.ifscCode')}</label>
                      <Input
                        value={accountForm.ifscCode}
                        onChange={(e) => setAccountForm({ ...accountForm, ifscCode: e.target.value })}
                        className="h-12 text-base rounded-xl"
                        placeholder={t('bank.ifscCode')}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('bank.balance')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    className="h-12 text-base rounded-xl"
                    placeholder="0.00"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingAccount}
                  className="w-full bg-[#f26f31] hover:bg-[#f26f31]/90 text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-[#f26f31]/20"
                >
                  {submittingAccount ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-5 w-5" />
                  )}
                  {t('bank.addAccount')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Landmark className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('bank.noAccounts')}</h3>
          <Button
            onClick={() => setShowAddAccount(true)}
            className="bg-[#f26f31] hover:bg-[#f26f31]/90 text-white h-12 px-6 text-base rounded-xl mt-4"
          >
            <Plus className="mr-2 h-5 w-5" />
            {t('bank.addAccount')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group overflow-hidden"
              onClick={() => fetchAccountDetail(account)}
            >
              <div className="h-1 transition-colors" style={{
                backgroundColor: account.accountType === 'bank' ? '#3B82F6' : account.accountType === 'cash' ? '#16A34A' : '#9333EA',
              }} />
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${accountTypeColor(account.accountType)}`}>
                    {accountTypeIcon(account.accountType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[#f26f31] transition-colors">
                      {account.accountName}
                    </h3>
                    {account.bankName && (
                      <p className="text-sm text-gray-500 mt-0.5">{account.bankName}</p>
                    )}
                    {account.accountNumber && (
                      <p className="text-xs text-gray-400 mt-0.5">A/C: ****{account.accountNumber.slice(-4)}</p>
                    )}
                    <p className={`text-xl font-bold mt-3 ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
