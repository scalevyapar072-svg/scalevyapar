import type { CompanyInvoiceSeller, CompanyTaxInvoiceDocument } from './labour-company-billing'

const PDF_PAGE_WIDTH = 595
const PDF_PAGE_HEIGHT = 842
const PAGE_MARGIN = 34
const PAGE_CONTENT_WIDTH = PDF_PAGE_WIDTH - PAGE_MARGIN * 2

const COLORS = {
  ink: [0.12, 0.16, 0.23],
  muted: [0.39, 0.45, 0.56],
  line: [0.82, 0.86, 0.91],
  soft: [0.95, 0.97, 0.99],
  accent: [0.15, 0.32, 0.78],
  accentSoft: [0.9, 0.94, 1],
  white: [1, 1, 1],
  success: [0.05, 0.48, 0.33],
} as const

type PdfColor = readonly [number, number, number]

type TextOptions = {
  size?: number
  bold?: boolean
  color?: PdfColor
}

type WrapOptions = TextOptions & {
  lineHeight?: number
  align?: 'left' | 'right' | 'center'
}

type BoxOptions = {
  fillColor?: PdfColor
  strokeColor?: PdfColor
  lineWidth?: number
}

type DetailRow = {
  label: string
  value: string
}

const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const estimateTextWidth = (value: string, size: number) => value.length * size * 0.5

const splitLongToken = (token: string, size: number, maxWidth: number) => {
  const maxChars = Math.max(1, Math.floor(maxWidth / (size * 0.5)))
  if (token.length <= maxChars) {
    return [token]
  }

  const parts: string[] = []
  let cursor = 0
  while (cursor < token.length) {
    parts.push(token.slice(cursor, cursor + maxChars))
    cursor += maxChars
  }
  return parts
}

const wrapText = (value: string, size: number, maxWidth: number) => {
  const tokens = value
    .split(/\s+/)
    .filter(Boolean)
    .flatMap(token => splitLongToken(token, size, maxWidth))

  if (tokens.length === 0) {
    return ['']
  }

  const lines: string[] = []
  let currentLine = ''

  for (const token of tokens) {
    const nextLine = currentLine ? `${currentLine} ${token}` : token
    if (estimateTextWidth(nextLine, size) <= maxWidth || !currentLine) {
      currentLine = nextLine
      continue
    }

    lines.push(currentLine)
    currentLine = token
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

const createPdfDocument = (contentStream: string) => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

const formatCurrency = (value: number) => `INR ${Math.max(0, Math.round(Number(value || 0))).toLocaleString('en-IN')}`

const formatTaxPercent = (value: number) => `${Number(value || 0).toLocaleString('en-IN')}%`

const isPlaceholderBankValue = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return (
    !normalized ||
    normalized.includes('to be shared') ||
    normalized.includes('available on request') ||
    normalized === 'tba0000000' ||
    normalized === 'india'
  )
}

const resolveBankLines = (seller: CompanyInvoiceSeller) => {
  const keyBankFields = [seller.bankName, seller.accountNumber, seller.ifsc, seller.branch].filter(
    value => !isPlaceholderBankValue(String(value || ''))
  )

  if (keyBankFields.length === 0) {
    return ['Bank details available on request']
  }

  const detailLines = [
    ['Account Name', seller.accountName],
    ['Bank Name', seller.bankName],
    ['Account Number', seller.accountNumber],
    ['IFSC', seller.ifsc],
    ['Branch', seller.branch],
  ].filter(([, value]) => !isPlaceholderBankValue(String(value || '')))

  if (detailLines.length === 0) {
    return ['Bank details available on request']
  }

  return detailLines.map(([label, value]) => `${label}: ${value}`)
}

export const renderBillingInvoicePdf = (invoice: CompanyTaxInvoiceDocument) => {
  const operators: string[] = []

  const addLine = (x1: number, y1: number, x2: number, y2: number, color = COLORS.line, lineWidth = 1) => {
    operators.push(`${lineWidth} w`)
    operators.push(`${color[0]} ${color[1]} ${color[2]} RG`)
    operators.push(`${x1} ${y1} m ${x2} ${y2} l S`)
  }

  const addRect = (x: number, y: number, width: number, height: number, options?: BoxOptions) => {
    const fillColor = options?.fillColor
    const strokeColor = options?.strokeColor ?? COLORS.line
    const lineWidth = options?.lineWidth ?? 1
    if (fillColor) {
      operators.push(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`)
      operators.push(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`)
      operators.push(`${lineWidth} w`)
      operators.push(`${x} ${y} ${width} ${height} re B`)
      return
    }

    operators.push(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`)
    operators.push(`${lineWidth} w`)
    operators.push(`${x} ${y} ${width} ${height} re S`)
  }

  const addText = (text: string, x: number, y: number, options?: TextOptions) => {
    const size = options?.size ?? 10
    const font = options?.bold ? 'F2' : 'F1'
    const color = options?.color ?? COLORS.ink
    operators.push(`${color[0]} ${color[1]} ${color[2]} rg`)
    operators.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`)
  }

  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, options?: WrapOptions) => {
    const size = options?.size ?? 10
    const lineHeight = options?.lineHeight ?? size + 3
    const lines = wrapText(text, size, maxWidth)
    lines.forEach((line, index) => {
      const textWidth = estimateTextWidth(line, size)
      const drawX =
        options?.align === 'right'
          ? x + maxWidth - textWidth
          : options?.align === 'center'
            ? x + (maxWidth - textWidth) / 2
            : x
      addText(line, drawX, y - index * lineHeight, options)
    })
    return y - (lines.length - 1) * lineHeight
  }

  const getRowHeight = (rows: DetailRow[], contentWidth: number, valueWidth: number, size = 9) =>
    rows.reduce((height, row) => {
      const valueLines = wrapText(row.value, size, valueWidth)
      return height + Math.max(18, valueLines.length * 12 + 6)
    }, 0)

  const drawDetailSection = (
    title: string,
    rows: DetailRow[],
    x: number,
    topY: number,
    width: number,
    options?: { accent?: boolean; minHeight?: number; titleColor?: PdfColor }
  ) => {
    const padding = 12
    const valueWidth = width - 114 - padding * 2
    const rowsHeight = getRowHeight(rows, width - padding * 2, valueWidth)
    const height = Math.max(options?.minHeight ?? 0, rowsHeight + 32)
    const bottomY = topY - height
    addRect(x, bottomY, width, height, {
      fillColor: options?.accent ? COLORS.accentSoft : COLORS.white,
      strokeColor: options?.accent ? COLORS.accent : COLORS.line,
    })
    addText(title, x + padding, topY - 18, {
      size: 11,
      bold: true,
      color: options?.titleColor ?? (options?.accent ? COLORS.accent : COLORS.ink),
    })
    let rowY = topY - 36
    rows.forEach((row, index) => {
      if (index > 0) {
        addLine(x + padding, rowY + 4, x + width - padding, rowY + 4, COLORS.line, 0.8)
        rowY -= 8
      }
      addText(row.label, x + padding, rowY, { size: 8, bold: true, color: COLORS.muted })
      const endY = addWrappedText(row.value, x + padding + 84, rowY, valueWidth, { size: 9, lineHeight: 12 })
      rowY = endY - 10
    })
    return bottomY
  }

  const addSummaryRow = (label: string, value: string, x: number, y: number, width: number, strong = false) => {
    addText(label, x, y, { size: 9, bold: strong, color: strong ? COLORS.ink : COLORS.muted })
    addWrappedText(value, x + width - 90, y, 90, {
      size: 10,
      bold: strong,
      align: 'right',
      color: strong ? COLORS.accent : COLORS.ink,
    })
  }

  const tableCols = {
    sr: PAGE_MARGIN,
    particulars: PAGE_MARGIN + 36,
    hsn: PAGE_MARGIN + 282,
    taxable: PAGE_MARGIN + 352,
    total: PAGE_MARGIN + 442,
  }

  const tableWidths = {
    sr: 36,
    particulars: 246,
    hsn: 70,
    taxable: 90,
    total: 85,
  }

  addRect(0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT, { fillColor: COLORS.white, strokeColor: COLORS.white })

  addRect(PAGE_MARGIN, 760, 235, 48, { fillColor: COLORS.accent, strokeColor: COLORS.accent })
  addText('ScaleVyapar Rozgar', PAGE_MARGIN + 16, 788, { size: 17, bold: true, color: COLORS.white })
  addText('Professional recruitment billing invoice', PAGE_MARGIN + 16, 772, { size: 9, color: COLORS.white })

  addText('TAX INVOICE', PDF_PAGE_WIDTH - PAGE_MARGIN - estimateTextWidth('TAX INVOICE', 19), 790, {
    size: 19,
    bold: true,
    color: COLORS.ink,
  })
  addText('Original for Recipient', PDF_PAGE_WIDTH - PAGE_MARGIN - estimateTextWidth('Original for Recipient', 9), 774, {
    size: 9,
    color: COLORS.muted,
  })
  addLine(PAGE_MARGIN, 748, PDF_PAGE_WIDTH - PAGE_MARGIN, 748, COLORS.line, 1.2)

  const sellerRows: DetailRow[] = [
    { label: 'Seller', value: invoice.seller.name },
    { label: 'Address', value: invoice.seller.address },
    { label: 'GSTIN / UIN', value: invoice.seller.gstin || 'Not added' },
    { label: 'Email', value: invoice.seller.email || 'Not added' },
    { label: 'Phone', value: invoice.seller.phone || 'Not added' },
  ]

  const invoiceRows: DetailRow[] = [
    { label: 'Invoice No', value: invoice.invoiceNumber },
    { label: 'Invoice Date', value: invoice.invoiceDate },
    { label: 'Mode / Terms', value: `${invoice.modeOfPayment} / ${invoice.termsOfPayment}` },
    { label: 'Place of Supply', value: invoice.buyer.placeOfSupply || 'Not available' },
    { label: 'IRN', value: invoice.irnNumber || 'Not applicable' },
    { label: 'Ack No', value: invoice.acknowledgementNumber || 'Not applicable' },
    { label: 'Ack Date', value: invoice.acknowledgementDate || 'Not applicable' },
  ]

  const billToRows: DetailRow[] = [
    { label: 'Customer', value: invoice.buyer.name },
    { label: 'Address', value: invoice.buyer.address },
    { label: 'GSTIN / UIN', value: invoice.buyer.gstin || 'Not added' },
    { label: 'PAN / IT', value: invoice.buyer.pan || 'Not added' },
    { label: 'Email', value: invoice.buyer.email || 'Not added' },
  ]

  const topSectionY = 726
  const leftBottom = drawDetailSection('Seller Details', sellerRows, PAGE_MARGIN, topSectionY, 256, {
    accent: true,
    minHeight: 146,
  })
  const rightBottom = drawDetailSection('Invoice Details', invoiceRows, PAGE_MARGIN + 272, topSectionY, 255, {
    minHeight: 170,
  })
  const billToTop = Math.min(leftBottom, rightBottom) - 18
  const billToBottom = drawDetailSection('Bill To', billToRows, PAGE_MARGIN, billToTop, PAGE_CONTENT_WIDTH, {
    minHeight: 114,
  })

  const serviceSectionTop = billToBottom - 28
  const particularsLines = wrapText(invoice.particulars, 9, tableWidths.particulars - 18)
  const itemBodyHeight = Math.max(42, particularsLines.length * 12 + 12)
  const totalRowHeight = 24
  const itemTableHeight = 24 + itemBodyHeight + totalRowHeight
  const itemTableBottom = serviceSectionTop - itemTableHeight

  addText('Service / Plan Details', PAGE_MARGIN, serviceSectionTop + 16, { size: 11, bold: true })
  addRect(PAGE_MARGIN, itemTableBottom, PAGE_CONTENT_WIDTH, itemTableHeight, {
    fillColor: COLORS.white,
    strokeColor: COLORS.line,
  })
  addRect(PAGE_MARGIN, serviceSectionTop - 24, PAGE_CONTENT_WIDTH, 24, {
    fillColor: COLORS.soft,
    strokeColor: COLORS.line,
  })

  const columnEdges = [
    PAGE_MARGIN + tableWidths.sr,
    PAGE_MARGIN + tableWidths.sr + tableWidths.particulars,
    PAGE_MARGIN + tableWidths.sr + tableWidths.particulars + tableWidths.hsn,
    PAGE_MARGIN + tableWidths.sr + tableWidths.particulars + tableWidths.hsn + tableWidths.taxable,
  ]
  columnEdges.forEach(edge => addLine(edge, serviceSectionTop, edge, itemTableBottom, COLORS.line, 0.8))
  addLine(PAGE_MARGIN, serviceSectionTop - 24, PAGE_MARGIN + PAGE_CONTENT_WIDTH, serviceSectionTop - 24, COLORS.line, 0.8)
  addLine(PAGE_MARGIN, itemTableBottom + totalRowHeight, PAGE_MARGIN + PAGE_CONTENT_WIDTH, itemTableBottom + totalRowHeight, COLORS.line, 0.8)

  addWrappedText('Sr No.', tableCols.sr + 4, serviceSectionTop - 15, tableWidths.sr - 8, {
    size: 8,
    bold: true,
    align: 'center',
  })
  addText('Particulars', tableCols.particulars + 8, serviceSectionTop - 15, { size: 8, bold: true })
  addWrappedText('HSN / SAC', tableCols.hsn + 4, serviceSectionTop - 15, tableWidths.hsn - 8, {
    size: 8,
    bold: true,
    align: 'center',
  })
  addWrappedText('Taxable Value', tableCols.taxable + 4, serviceSectionTop - 15, tableWidths.taxable - 8, {
    size: 8,
    bold: true,
    align: 'center',
  })
  addWrappedText('Total Amount', tableCols.total + 6, serviceSectionTop - 15, tableWidths.total - 12, {
    size: 8,
    bold: true,
    align: 'center',
  })

  const itemRowTopY = serviceSectionTop - 42
  addWrappedText('1', tableCols.sr + 4, itemRowTopY, tableWidths.sr - 8, {
    size: 9,
    align: 'center',
  })
  addWrappedText(invoice.particulars, tableCols.particulars + 9, itemRowTopY + 4, tableWidths.particulars - 18, {
    size: 9,
    lineHeight: 12,
  })
  addWrappedText(invoice.hsnCode, tableCols.hsn + 4, itemRowTopY, tableWidths.hsn - 8, {
    size: 9,
    align: 'center',
  })
  addWrappedText(formatCurrency(invoice.taxableValue), tableCols.taxable + 6, itemRowTopY, tableWidths.taxable - 12, {
    size: 9,
    align: 'right',
  })
  addWrappedText(formatCurrency(invoice.totalAmount), tableCols.total + 6, itemRowTopY, tableWidths.total - 12, {
    size: 9,
    bold: true,
    align: 'right',
  })

  const totalRowY = itemTableBottom + 8
  addWrappedText('Total', tableCols.taxable + 6, totalRowY, tableWidths.taxable - 12, {
    size: 9,
    bold: true,
    align: 'right',
  })
  addWrappedText(formatCurrency(invoice.totalAmount), tableCols.total + 6, totalRowY, tableWidths.total - 12, {
    size: 10,
    bold: true,
    align: 'right',
    color: COLORS.accent,
  })

  const summaryTop = itemTableBottom - 28
  const summaryLeftWidth = 300
  const summaryRightX = PAGE_MARGIN + summaryLeftWidth + 14
  const summaryRightWidth = PAGE_CONTENT_WIDTH - summaryLeftWidth - 14

  addRect(PAGE_MARGIN, summaryTop - 78, summaryLeftWidth, 78, {
    fillColor: COLORS.soft,
    strokeColor: COLORS.line,
  })
  addText('Amount in words', PAGE_MARGIN + 12, summaryTop - 18, { size: 10, bold: true, color: COLORS.muted })
  addWrappedText(invoice.amountInWords, PAGE_MARGIN + 12, summaryTop - 40, summaryLeftWidth - 24, {
    size: 12,
    bold: true,
    lineHeight: 16,
  })

  addRect(summaryRightX, summaryTop - 98, summaryRightWidth, 98, {
    fillColor: COLORS.white,
    strokeColor: COLORS.line,
  })
  addText('Invoice Summary', summaryRightX + 12, summaryTop - 18, { size: 10, bold: true })

  const summaryRows: Array<[string, string, boolean]> = [
    ['Subtotal', formatCurrency(invoice.taxableValue), false],
    [`CGST @ ${formatTaxPercent(invoice.cgstPercentage)}`, formatCurrency(invoice.cgstAmount), false],
    [`SGST @ ${formatTaxPercent(invoice.sgstPercentage)}`, formatCurrency(invoice.sgstAmount), false],
    ['Total Tax', formatCurrency(invoice.taxAmount), false],
    ['Grand Total', formatCurrency(invoice.totalAmount), true],
  ]

  let summaryRowY = summaryTop - 36
  summaryRows.forEach(([label, value, strong], index) => {
    if (index > 0) {
      addLine(summaryRightX + 12, summaryRowY + 5, summaryRightX + summaryRightWidth - 12, summaryRowY + 5, COLORS.line, 0.8)
      summaryRowY -= 6
    }
    addSummaryRow(label, value, summaryRightX + 12, summaryRowY, summaryRightWidth - 24, strong)
    summaryRowY -= 14
  })

  const summaryBottom = summaryTop - 98
  const taxTop = summaryBottom - 22
  addText('Tax Breakup', PAGE_MARGIN, taxTop + 16, { size: 11, bold: true })
  addRect(PAGE_MARGIN, taxTop - 58, PAGE_CONTENT_WIDTH, 58, {
    fillColor: COLORS.white,
    strokeColor: COLORS.line,
  })
  addRect(PAGE_MARGIN, taxTop - 22, PAGE_CONTENT_WIDTH, 22, {
    fillColor: COLORS.soft,
    strokeColor: COLORS.line,
  })

  const taxEdges = [PAGE_MARGIN + 214, PAGE_MARGIN + 324, PAGE_MARGIN + 422]
  taxEdges.forEach(edge => addLine(edge, taxTop, edge, taxTop - 58, COLORS.line, 0.8))
  addLine(PAGE_MARGIN, taxTop - 22, PAGE_MARGIN + PAGE_CONTENT_WIDTH, taxTop - 22, COLORS.line, 0.8)

  addText('Tax Type', PAGE_MARGIN + 8, taxTop - 14, { size: 8, bold: true })
  addText('Taxable Value', PAGE_MARGIN + 224, taxTop - 14, { size: 8, bold: true })
  addText('Tax Amount', PAGE_MARGIN + 334, taxTop - 14, { size: 8, bold: true })
  addText('Total', PAGE_MARGIN + 432, taxTop - 14, { size: 8, bold: true })

  const taxLabel =
    invoice.igstAmount > 0
      ? `IGST @ ${formatTaxPercent(invoice.igstPercentage)}`
      : `CGST @ ${formatTaxPercent(invoice.cgstPercentage)} + SGST @ ${formatTaxPercent(invoice.sgstPercentage)}`

  addWrappedText(taxLabel, PAGE_MARGIN + 8, taxTop - 39, 198, { size: 9, lineHeight: 11 })
  addWrappedText(formatCurrency(invoice.taxableValue), PAGE_MARGIN + 224, taxTop - 39, 86, { size: 9, align: 'right' })
  addWrappedText(formatCurrency(invoice.taxAmount), PAGE_MARGIN + 334, taxTop - 39, 76, { size: 9, align: 'right' })
  addWrappedText(formatCurrency(invoice.totalAmount), PAGE_MARGIN + 432, taxTop - 39, 86, { size: 9, align: 'right', bold: true })

  const lowerTop = taxTop - 70
  const lowerSectionWidth = (PAGE_CONTENT_WIDTH - 16) / 2
  const lowerSectionHeight = 62
  const lowerBottom = lowerTop - lowerSectionHeight

  addRect(PAGE_MARGIN, lowerBottom, lowerSectionWidth, lowerSectionHeight, {
    fillColor: COLORS.white,
    strokeColor: COLORS.line,
  })
  addText('Declaration', PAGE_MARGIN + 12, lowerTop - 18, { size: 10, bold: true })
  addWrappedText(invoice.declaration, PAGE_MARGIN + 12, lowerTop - 38, lowerSectionWidth - 24, {
    size: 8.5,
    lineHeight: 10,
    color: COLORS.ink,
  })

  const bankX = PAGE_MARGIN + lowerSectionWidth + 16
  const bankLines = resolveBankLines(invoice.seller)
  addRect(bankX, lowerBottom, lowerSectionWidth, lowerSectionHeight, {
    fillColor: COLORS.white,
    strokeColor: COLORS.line,
  })
  addText('Bank Details', bankX + 12, lowerTop - 18, { size: 10, bold: true })
  addWrappedText(bankLines.join(' | '), bankX + 12, lowerTop - 38, lowerSectionWidth - 24, {
    size: 8.5,
    lineHeight: 10,
    color: COLORS.ink,
  })

  const signatoryY = lowerBottom + 12
  addText('For ScaleVyapar Rozgar', PDF_PAGE_WIDTH - PAGE_MARGIN - 126, signatoryY + 16, {
    size: 10,
    bold: true,
  })
  addText('Authorised Signatory', PDF_PAGE_WIDTH - PAGE_MARGIN - 122, signatoryY, {
    size: 9,
    color: COLORS.muted,
  })
  addLine(PAGE_MARGIN, 28, PDF_PAGE_WIDTH - PAGE_MARGIN, 28, COLORS.line, 1)
  addText(invoice.note, PAGE_MARGIN, 14, { size: 8, color: COLORS.muted })

  const contentStream = operators.join('\n')
  return createPdfDocument(contentStream)
}
