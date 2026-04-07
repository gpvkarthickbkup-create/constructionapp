import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Amount to words (Indian numbering: lakhs, crores)
export function amountToWords(num: number): string {
  if (!num || num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const whole = Math.floor(Math.abs(num));
  return 'Rupees ' + convert(whole) + ' Only';
}

export function amountToWordsTa(num: number): string {
  if (!num || num === 0) return 'பூஜ்ஜியம்';
  const n = Math.round(Math.abs(num));
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} கோடி`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} லட்சம்`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} ஆயிரம்`;
  return `₹${n}`;
}

// Short format: 1.5L, 25K etc
export function amountShort(num: number): string {
  if (!num) return '₹0';
  const n = Math.abs(num);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

// Expense category icons (emoji)
export const categoryIcons: Record<string, string> = {
  'Cement': '🏗️', 'Steel / TMT': '⚙️', 'Bricks': '🧱', 'Sand': '⏳', 'Blue Metal / Jelly': '🪨',
  'Tiles': '🔲', 'Paint': '🎨', 'Plumbing': '🔧', 'Electrical': '⚡', 'Wood': '🪵',
  'Doors / Windows': '🚪', 'Waterproofing': '💧', 'Ready-mix Concrete': '🚛', 'Interior Materials': '🏠',
  'Glass': '🪟', 'Roofing Sheets': '🏠', 'Hardware': '🔩',
  'Mason': '👷', 'Carpenter': '🪚', 'Painter': '🎨', 'Electrician': '⚡', 'Plumber': '🔧',
  'Tile Worker': '🔲', 'Helpers': '🤝', 'Daily Wages': '💰', 'Contractor Bill': '📄',
  'Commission': '💼', 'Government Charges': '🏛️', 'Transport': '🚛', 'Loading / Unloading': '📦',
  'Machine Rental': '🏗️', 'JCB / Crane / Mixer': '🏗️', 'Fuel': '⛽', 'Worker Food / Stay': '🍽️',
  'Miscellaneous': '📋',
};

export const expenseTypeColors: Record<string, string> = {
  material: '#f26f31',
  labor: '#ACA9A9',
  commission: '#8B5CF6',
  transport: '#c9531a',
  rental: '#7A7878',
  miscellaneous: '#D4D2D2',
};

export const paymentStatusColors: Record<string, string> = {
  paid: '#10B981',
  partially_paid: '#f26f31',
  unpaid: '#EF4444',
};

export const siteStatusColors: Record<string, string> = {
  planning: '#ACA9A9',
  active: '#f26f31',
  on_hold: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
};
