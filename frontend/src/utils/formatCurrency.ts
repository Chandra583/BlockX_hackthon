/**
 * Currency formatting utilities
 */

export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param options - Currency formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '—';
  }

  const {
    currency = 'INR',
    locale = 'en-IN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(numAmount);
  } catch (error) {
    console.warn('Currency formatting failed:', error);
    // Fallback formatting
    return `₹${numAmount.toLocaleString('en-IN')}`;
  }
}

/**
 * Format price with Indian Rupee symbol
 * @param price - The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number | string | null | undefined): string {
  return formatCurrency(price, {
    currency: 'INR',
    locale: 'en-IN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Format price with decimal places for precise amounts
 * @param price - The price to format
 * @returns Formatted price string with decimals
 */
export function formatPriceWithDecimals(price: number | string | null | undefined): string {
  return formatCurrency(price, {
    currency: 'INR',
    locale: 'en-IN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Parse currency string to number
 * @param currencyString - Currency string to parse
 * @returns Parsed number or null if invalid
 */
export function parseCurrency(currencyString: string): number | null {
  if (!currencyString || currencyString === '—') {
    return null;
  }

  // Remove currency symbols and commas
  const cleaned = currencyString.replace(/[₹$€£,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Check if a value is a valid price
 * @param value - Value to check
 * @returns True if valid price
 */
export function isValidPrice(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}
