import { Platform } from 'react-native';

export const API_HOST = Platform.OS === 'web' ? 'http://localhost:4000' : 'http://192.168.1.5:4000';

export function fmt(n: number): string {
  if (n == null || isNaN(n)) return '\u20B90';
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1e7) s = (n / 1e7).toFixed(2) + ' Cr';
  else if (abs >= 1e5) s = (n / 1e5).toFixed(2) + ' L';
  else {
    const p = Math.round(Math.abs(n)).toString();
    let r = '';
    for (let i = 0; i < p.length; i++) {
      const pos = p.length - i;
      if (i > 0 && (pos === 3 || (pos > 3 && pos % 2 === 1))) r += ',';
      r += p[i];
    }
    s = (n < 0 ? '-' : '') + r;
    return '\u20B9' + s;
  }
  return '\u20B9' + s;
}

export function amtWords(n: number): string {
  if (!n || isNaN(n)) return '';
  const v = Math.round(Math.abs(n));
  if (v >= 10000000) return (v / 10000000).toFixed(2) + ' Crore Rupees';
  if (v >= 100000) return (v / 100000).toFixed(2) + ' Lakh Rupees';
  if (v >= 1000) return (v / 1000).toFixed(1) + ' Thousand Rupees';
  return v + ' Rupees';
}

export const C = {
  primary: '#f26f31',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1A1A2E',
  sub: '#6C7A89',
  border: '#F0F0F0',
  success: '#00C853',
  danger: '#FF1744',
  warning: '#FFB300',
  bgDark: '#0D0D0D',
  cardDark: '#1A1A1A',
  textDark: '#F0F0F0',
  borderDark: '#2A2A2A',
  inputBg: '#F5F5F5',
  inputBgDark: '#262626',
};

export const typeEmoji: Record<string, string> = {
  material: '📦', labor: '👷', transport: '🚛', rental: '⚙️',
  commission: '💼', miscellaneous: '📋',
};

export const vendorTypeEmoji: Record<string, string> = {
  supplier: '📦', labor_contractor: '👷', transporter: '🚛',
  broker: '💼', engineer: '🔧', other: '📋',
};

export const payColor: Record<string, string> = {
  paid: '#00C853', partially_paid: '#FFB300', unpaid: '#FF1744',
};

export function inpS(dark: boolean) {
  return {
    backgroundColor: dark ? C.inputBgDark : C.inputBg,
    color: dark ? C.textDark : C.text,
    borderWidth: 1,
    borderColor: dark ? C.borderDark : C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '400' as const,
  } as const;
}
