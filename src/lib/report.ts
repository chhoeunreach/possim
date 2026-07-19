import type { Shift, Transaction } from "@/types"

export interface ReportTotals {
  openingUSD: number; openingKHR: number
  totalInUSD: number; totalOutUSD: number; totalInKHR: number; totalOutKHR: number
  cashInUSD: number; bankInUSD: number; cashOutUSD: number; bankOutUSD: number
  cashInKHR: number; bankInKHR: number; cashOutKHR: number; bankOutKHR: number
  expectedUSD: number; expectedKHR: number
  autoUSD: number; autoKHR: number
  inflowCount: number; outflowCount: number
  totalCostUSD: number; totalCostKHR: number
  revenueCostUSD: number; revenueCostKHR: number
  cashCostUSD: number; bankCostUSD: number
  cashCostKHR: number; bankCostKHR: number
  cashProfitUSD: number; bankProfitUSD: number
  cashProfitKHR: number; bankProfitKHR: number
  cashMarginUSD: number; bankMarginUSD: number
  cashMarginKHR: number; bankMarginKHR: number
  grossProfitUSD: number; grossProfitKHR: number
  grossMarginUSD: number; grossMarginKHR: number
  closingUSD: number; closingKHR: number
}

export function calcReportTotals(shift: Shift, txns: Transaction[]): ReportTotals {
  const openingUSD = parseFloat(String(shift.opening_usd || 0))
  const openingKHR = parseFloat(String(shift.opening_khr || 0))
  const closingUSD = parseFloat(String(shift.closing_usd || 0))
  const closingKHR = parseFloat(String(shift.closing_khr || 0))

  let totalInUSD = 0, totalOutUSD = 0, totalInKHR = 0, totalOutKHR = 0
  let cashInUSD = 0, bankInUSD = 0, cashOutUSD = 0, bankOutUSD = 0
  let cashInKHR = 0, bankInKHR = 0, cashOutKHR = 0, bankOutKHR = 0
  let inflowCount = 0, outflowCount = 0
  let totalCostUSD = 0, totalCostKHR = 0
  let revenueCostUSD = 0, revenueCostKHR = 0
  let cashCostUSD = 0, bankCostUSD = 0
  let cashCostKHR = 0, bankCostKHR = 0

  for (const x of txns) {
    if (x.currency === 'USD') {
      if (x.type === 'inflow') {
        totalInUSD += x.amount; inflowCount++
        revenueCostUSD += x.cost || 0
        if (x.payment_method === 'Cash') {
          cashInUSD += x.amount
          cashCostUSD += x.cost || 0
        } else {
          bankInUSD += x.amount
          bankCostUSD += x.cost || 0
        }
      } else {
        totalOutUSD += x.amount; outflowCount++
        if (x.payment_method === 'Cash') cashOutUSD += x.amount; else bankOutUSD += x.amount
      }
      totalCostUSD += x.cost || 0
    } else {
      if (x.type === 'inflow') {
        totalInKHR += x.amount; inflowCount++
        revenueCostKHR += x.cost || 0
        if (x.payment_method === 'Cash') {
          cashInKHR += x.amount
          cashCostKHR += x.cost || 0
        } else {
          bankInKHR += x.amount
          bankCostKHR += x.cost || 0
        }
      } else {
        totalOutKHR += x.amount; outflowCount++
        if (x.payment_method === 'Cash') cashOutKHR += x.amount; else bankOutKHR += x.amount
      }
      totalCostKHR += x.cost || 0
    }
  }

  const expectedUSD = openingUSD + totalInUSD - totalOutUSD
  const expectedKHR = openingKHR + totalInKHR - totalOutKHR

  const cashProfitUSD = cashInUSD - cashCostUSD
  const bankProfitUSD = bankInUSD - bankCostUSD
  const cashProfitKHR = cashInKHR - cashCostKHR
  const bankProfitKHR = bankInKHR - bankCostKHR
  const grossProfitUSD = totalInUSD - revenueCostUSD
  const grossProfitKHR = totalInKHR - revenueCostKHR

  return {
    openingUSD, openingKHR,
    totalInUSD, totalOutUSD, totalInKHR, totalOutKHR,
    cashInUSD, bankInUSD, cashOutUSD, bankOutUSD,
    cashInKHR, bankInKHR, cashOutKHR, bankOutKHR,
    expectedUSD, expectedKHR,
    autoUSD: Math.max(0, expectedUSD),
    autoKHR: Math.max(0, expectedKHR),
    inflowCount, outflowCount,
    totalCostUSD, totalCostKHR,
    revenueCostUSD, revenueCostKHR,
    cashCostUSD, bankCostUSD,
    cashCostKHR, bankCostKHR,
    cashProfitUSD, bankProfitUSD,
    cashProfitKHR, bankProfitKHR,
    cashMarginUSD: cashInUSD > 0 ? (cashProfitUSD / cashInUSD) * 100 : 0,
    bankMarginUSD: bankInUSD > 0 ? (bankProfitUSD / bankInUSD) * 100 : 0,
    cashMarginKHR: cashInKHR > 0 ? (cashProfitKHR / cashInKHR) * 100 : 0,
    bankMarginKHR: bankInKHR > 0 ? (bankProfitKHR / bankInKHR) * 100 : 0,
    grossProfitUSD, grossProfitKHR,
    grossMarginUSD: totalInUSD > 0 ? (grossProfitUSD / totalInUSD) * 100 : 0,
    grossMarginKHR: totalInKHR > 0 ? (grossProfitKHR / totalInKHR) * 100 : 0,
    closingUSD, closingKHR,
  }
}
