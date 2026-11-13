/**
 * Strict commercial rounding to 2 decimal places.
 */
export function round2(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

/**
 * Extracts numeric unit size or weight (e.g. "30 KG", "30kg", "30", 30 -> 30)
 * Defaults to 1 if not specified, 0, or invalid.
 */
export function extractUnitSize(val, defaultVal = 1) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return val > 0 ? val : defaultVal;
  const str = String(val).trim();
  const match = str.match(/([0-9.]+)/);
  if (match && !isNaN(parseFloat(match[1]))) {
    const parsed = parseFloat(match[1]);
    return parsed > 0 ? parsed : defaultVal;
  }
  return defaultVal;
}

/**
 * Calculates item and total pricing breakdown according to platform contract:
 * - Flat commission: Flat Commission Per Unit * Product Unit Size * Selected Quantity
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
  
  // Extract unit size
  const uSize = extractUnitSize(item.unitSize || item.variantSize || item.packetSize, 1);

  // Extract base seller price
  let baseSellerPrice = 0;
  if (item.sellerPricePerBaseUnit !== undefined && item.sellerPricePerBaseUnit !== null) {
    baseSellerPrice = Number(item.sellerPricePerBaseUnit);
  } else if (item.priceTiers && item.priceTiers.length > 0) {
    const sortedTiers = [...item.priceTiers].sort((a, b) => b.minQty - a.minQty);
    const activeTier = sortedTiers.find(t => qty >= t.minQty);
    if (activeTier) {
      baseSellerPrice = activeTier.sellerPrice !== undefined ? Number(activeTier.sellerPrice) : Number(activeTier.price);
    }
  }
  if (!baseSellerPrice) {
    if (isB2B) {
      baseSellerPrice = Number(item.sellerB2bPrice ?? item.sellerPrice ?? item.b2bPrice ?? item.price ?? 0);
    } else {
      baseSellerPrice = Number(item.sellerPrice ?? item.price ?? 0);
    }
  }

  // Determine price basis: 'per_unit' (Method A) vs 'per_package' (Method B)
  const isPackagePrice = item.priceBasis === 'per_package' || item.isPackagePrice === true;

  // Step 1: Seller Price Per Product Unit (Complete Package)
  let sellerPricePerProductUnit = 0;
  let sellerPricePerBaseUnit = baseSellerPrice;

  if (item.sellerPricePerProductUnit !== undefined && item.sellerPricePerProductUnit !== null) {
    sellerPricePerProductUnit = Number(item.sellerPricePerProductUnit);
    if (!isPackagePrice && item.sellerPricePerBaseUnit !== undefined) {
      sellerPricePerBaseUnit = Number(item.sellerPricePerBaseUnit);
    } else if (uSize > 0) {
      sellerPricePerBaseUnit = round2(sellerPricePerProductUnit / uSize);
    }
  } else if (isPackagePrice) {
    sellerPricePerProductUnit = round2(baseSellerPrice);
    sellerPricePerBaseUnit = uSize > 0 ? round2(sellerPricePerProductUnit / uSize) : sellerPricePerProductUnit;
  } else {
    sellerPricePerProductUnit = round2(baseSellerPrice * uSize);
    sellerPricePerBaseUnit = round2(baseSellerPrice);
  }

  // Step 2: Commission Per Product Unit based on actual Product Unit Size (e.g. 20 * 30 = 600)
  const cType = item.commissionType === 'percentage' ? 'percentage' : 'flat';
  const cVal = Number(item.adminCommissionPerBaseUnit ?? item.commissionRate ?? item.commissionValue ?? 0);

  let commissionPerProductUnit = 0;
  if (cType === 'flat') {
    commissionPerProductUnit = round2(cVal * uSize);
  } else {
    commissionPerProductUnit = round2((sellerPricePerProductUnit * cVal) / 100);
  }

  // Step 3: Customer Unit Base Price (e.g. 1500 + 600 = 2100)
  const customerUnitBasePrice = round2(sellerPricePerProductUnit + commissionPerProductUnit);

  // Step 4: Total Seller Amount (e.g. 1500 * 2 = 3000)
  const totalSellerPrice = round2(sellerPricePerProductUnit * qty);

  // Step 5: Total Weight & Total Commission (Total Weight = Qty * UnitSize, Total Comm = Total Weight * Rate)
  const totalProductWeight = round2(uSize * qty);
  const totalCommission = cType === 'flat' ? round2(totalProductWeight * cVal) : round2(commissionPerProductUnit * qty);

  // Step 7: GST
  const gstRate = Number(item.gstPercent) || 0;
  let totalGst = 0;
  let finalCustomerPrice = subtotal;

  if (isB2B) {
    totalGst = round2(subtotal * (gstRate / 100));
    finalCustomerPrice = round2(subtotal + totalGst);
  } else {
    if (gstRate > 0) {
      const baseBeforeTax = subtotal / (1 + gstRate / 100);
      totalGst = round2(subtotal - baseBeforeTax);
    }
    finalCustomerPrice = subtotal;
  }

  const unitCustomerPrice = round2(finalCustomerPrice / qty);
  const unitGst = round2(totalGst / qty);

  return {
    quantity: qty,
    priceBasis: isPackagePrice ? 'per_package' : 'per_unit',
    packagingType: (item.packagingType || item.unit || 'BAG').toUpperCase(),
    measurementBasis: (item.measurementBasis || item.measurementUnit || 'KG').toUpperCase(),
    sellerUnitPrice: sellerPricePerProductUnit,
    sellerPricePerBaseUnit: sellerPricePerBaseUnit,
    sellerPricePerProductUnit,
    unit: item.unit || 'unit',
    productMeasurementUnit: item.measurementUnit || item.unit || 'unit',
    measurementUnit: item.measurementUnit || item.unit || 'unit',
    unitSize: uSize,
    totalProductWeight,
    commissionType: cType,
    commissionRate: cVal,
    unitCommission: commissionPerProductUnit,
    commissionPerProductUnit,
    customerUnitBasePrice,
    totalSellerPrice,
    totalCommission,
    subtotal,
    totalCustomerBase: subtotal,
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
