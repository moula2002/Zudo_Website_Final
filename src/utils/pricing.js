/**
 * Strict commercial rounding to 2 decimal places.
 */
export function round2(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

/**
 * Calculates item and total pricing breakdown according to platform contract:
 * - Flat commission: Flat Commission Per Unit * Selected Quantity
 * - Percentage commission: (Seller Unit Price * (Commission Rate / 100)) * Selected Quantity
 * - GST rules:
 *     - B2B: GST added on top of totalCustomerBase (totalCustomerBase * (gstPercent / 100))
 *     - B2C: GST inclusive in totalCustomerBase
 */
export function calculateItemPricing({
  item,
  quantity = 1,
  isB2B = false
}) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  
  // Extract seller unit price
  let sUnitPrice = 0;
  if (item.priceTiers && item.priceTiers.length > 0) {
    const sortedTiers = [...item.priceTiers].sort((a, b) => b.minQty - a.minQty);
    const activeTier = sortedTiers.find(t => qty >= t.minQty);
    if (activeTier) {
      sUnitPrice = activeTier.sellerPrice !== undefined ? Number(activeTier.sellerPrice) : Number(activeTier.price);
    }
  }
  if (!sUnitPrice) {
    if (isB2B) {
      sUnitPrice = Number(item.sellerB2bPrice ?? item.sellerPrice ?? item.b2bPrice ?? item.price ?? 0);
    } else {
      sUnitPrice = Number(item.sellerPrice ?? item.price ?? 0);
    }
  }

  // Extract commission rules
  const cType = item.commissionType === 'percentage' ? 'percentage' : 'flat';
  const cVal = Number(item.commissionValue ?? (cType === 'flat' ? item.commissionAmount : 0) ?? 0);

  let unitCommission = 0;
  if (cType === 'flat') {
    unitCommission = cVal;
  } else {
    unitCommission = (sUnitPrice * cVal) / 100;
  }
  unitCommission = round2(unitCommission);

  const totalSellerPrice = round2(sUnitPrice * qty);
  const totalCommission = round2(unitCommission * qty);
  const totalCustomerBase = round2(totalSellerPrice + totalCommission);

  const gstRate = Number(item.gstPercent) || 0;
  let totalGst = 0;
  let finalCustomerPrice = totalCustomerBase;

  if (isB2B) {
    totalGst = round2(totalCustomerBase * (gstRate / 100));
    finalCustomerPrice = round2(totalCustomerBase + totalGst);
  } else {
    if (gstRate > 0) {
      const baseBeforeTax = totalCustomerBase / (1 + gstRate / 100);
      totalGst = round2(totalCustomerBase - baseBeforeTax);
    }
    finalCustomerPrice = totalCustomerBase;
  }

  const unitCustomerPrice = round2(finalCustomerPrice / qty);
  const unitGst = round2(totalGst / qty);

  return {
    quantity: qty,
    sellerUnitPrice: sUnitPrice,
    commissionType: cType,
    commissionRate: cVal,
    unitCommission,
    totalSellerPrice,
    totalCommission,
    totalCustomerBase,
    gstPercent: gstRate,
    unitGst,
    totalGst,
    unitCustomerPrice,
    finalCustomerPrice
  };
}

export function calculateCartSummary(cartItems = [], isB2B = false) {
  let subtotal = 0;
  let totalSellerBase = 0;
  let totalCommission = 0;
  let totalGst = 0;

  for (const item of cartItems) {
    const pricing = calculateItemPricing({ item, quantity: item.quantity, isB2B });
    subtotal += pricing.finalCustomerPrice;
    totalSellerBase += pricing.totalSellerPrice;
    totalCommission += pricing.totalCommission;
    totalGst += pricing.totalGst;
  }

  subtotal = round2(subtotal);
  totalSellerBase = round2(totalSellerBase);
  totalCommission = round2(totalCommission);
  totalGst = round2(totalGst);

  const deliveryFee = subtotal > 500 || cartItems.length === 0 ? 0 : 50;
  const total = round2(subtotal + deliveryFee);

  return {
    subtotal,
    totalSellerBase,
    totalCommission,
    totalGst,
    deliveryFee,
    total
  };
}
