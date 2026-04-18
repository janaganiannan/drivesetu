/**
 * Formats a number as Indian Currency (INR)
 * Example: 1299 -> ₹1,299
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculates the discount percentage
 */
export const calculateDiscount = (price: number, mrp: number): number => {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

/**
 * Generates a random order ID
 */
export const generateOrderId = (): string => {
  return "TH-" + Math.random().toString(36).substr(2, 9).toUpperCase();
};
