import type { CompanyTaxInvoiceDocument } from './labour-company-billing'

const PDF_PAGE_WIDTH = 595
const PDF_PAGE_HEIGHT = 842
const PDF_LEFT = 40
const PDF_RIGHT = 555

const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const wrapText = (value: string, size: number, maxWidth: number) => {
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return ['']
  }

  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    const estimatedWidth = nextLine.length * size * 0.52
    if (estimatedWidth <= maxWidth || !currentLine) {
      currentLine = nextLine
      continue
    }

    lines.push(currentLine)
    currentLine = word
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
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
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

export const renderBillingInvoicePdf = (invoice: CompanyTaxInvoiceDocument) => {
  const operators: string[] = ['0.12 w', '0 0 0 RG', '0 0 0 rg']
  let currentY = 800

  const addText = (text: string, x: number, y: number, options?: { size?: number; bold?: boolean }) => {
    const size = options?.size ?? 11
    const font = options?.bold ? 'F2' : 'F1'
    operators.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`)
  }

  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    options?: { size?: number; bold?: boolean; lineHeight?: number }
  ) => {
    const size = options?.size ?? 11
    const lineHeight = options?.lineHeight ?? size + 3
    const lines = wrapText(text, size, maxWidth)
    lines.forEach((line, index) => addText(line, x, y - index * lineHeight, { size, bold: options?.bold }))
    return y - (lines.length - 1) * lineHeight
  }

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    operators.push(`${x1} ${y1} m ${x2} ${y2} l S`)
  }

  const addBox = (x: number, y: number, width: number, height: number) => {
    operators.push(`${x} ${y} ${width} ${height} re S`)
  }

  addText('TAX INVOICE', 232, currentY, { size: 20, bold: true })
  currentY -= 28
  addLine(PDF_LEFT, currentY, PDF_RIGHT, currentY)
  currentY -= 18

  addText('Seller', PDF_LEFT, currentY, { size: 12, bold: true })
  addText('IRN / Ack Details', 350, currentY, { size: 12, bold: true })
  currentY -= 16

  currentY = addWrappedText(invoice.seller.name, PDF_LEFT, currentY, 250, { size: 11, bold: true, lineHeight: 14 })
  currentY -= 14
  currentY = addWrappedText(invoice.seller.address, PDF_LEFT, currentY, 250, { size: 10, lineHeight: 13 })
  currentY -= 14
  addText(`GSTIN/UIN: ${invoice.seller.gstin || 'Not added'}`, PDF_LEFT, currentY, { size: 10 })
  addText(`IRN: ${invoice.irnNumber}`, 350, currentY, { size: 10 })
  currentY -= 14
  addText(`Email: ${invoice.seller.email}`, PDF_LEFT, currentY, { size: 10 })
  addText(`Ack No: ${invoice.acknowledgementNumber}`, 350, currentY, { size: 10 })
  currentY -= 14
  addText(`Phone: ${invoice.seller.phone}`, PDF_LEFT, currentY, { size: 10 })
  addText(`Ack Date: ${invoice.acknowledgementDate}`, 350, currentY, { size: 10 })
  currentY -= 18

  addLine(PDF_LEFT, currentY, PDF_RIGHT, currentY)
  currentY -= 20
  addText('Invoice Details', PDF_LEFT, currentY, { size: 12, bold: true })
  addText('Bill To', 350, currentY, { size: 12, bold: true })
  currentY -= 16
  addText(`Invoice No: ${invoice.invoiceNumber}`, PDF_LEFT, currentY, { size: 10 })
  currentY = addWrappedText(invoice.buyer.name, 350, currentY, 185, { size: 11, bold: true, lineHeight: 14 })
  currentY -= 14
  addText(`Invoice Date: ${invoice.invoiceDate}`, PDF_LEFT, currentY, { size: 10 })
  currentY = addWrappedText(invoice.buyer.address, 350, currentY, 185, { size: 10, lineHeight: 13 })
  currentY -= 14
  addText(`Mode/Terms: ${invoice.modeOfPayment} / ${invoice.termsOfPayment}`, PDF_LEFT, currentY, { size: 10 })
  addText(`GSTIN/UIN: ${invoice.buyer.gstin || 'Not added'}`, 350, currentY, { size: 10 })
  currentY -= 14
  addText(`Place of Supply: ${invoice.buyer.placeOfSupply}`, PDF_LEFT, currentY, { size: 10 })
  addText(`PAN/IT: ${invoice.buyer.pan || 'Not added'}`, 350, currentY, { size: 10 })
  currentY -= 22

  addBox(PDF_LEFT, currentY - 104, PDF_RIGHT - PDF_LEFT, 104)
  addLine(PDF_LEFT, currentY - 24, PDF_RIGHT, currentY - 24)
  addLine(PDF_LEFT, currentY - 52, PDF_RIGHT, currentY - 52)
  addLine(PDF_LEFT, currentY - 80, PDF_RIGHT, currentY - 80)
  addLine(280, currentY, 280, currentY - 104)
  addLine(350, currentY, 350, currentY - 104)
  addLine(430, currentY, 430, currentY - 104)

  addText('Particulars', PDF_LEFT + 8, currentY - 16, { size: 10, bold: true })
  addText('HSN', 294, currentY - 16, { size: 10, bold: true })
  addText('Taxable value', 364, currentY - 16, { size: 10, bold: true })
  addText('Amount', 448, currentY - 16, { size: 10, bold: true })

  addWrappedText(invoice.particulars, PDF_LEFT + 8, currentY - 40, 220, { size: 10, lineHeight: 13 })
  addText(invoice.hsnCode, 294, currentY - 40, { size: 10 })
  addText(`INR ${invoice.taxableValue.toLocaleString('en-IN')}`, 364, currentY - 40, { size: 10 })
  addText(`INR ${invoice.totalAmount.toLocaleString('en-IN')}`, 448, currentY - 40, { size: 10, bold: true })

  addText(`GST @ ${invoice.gstPercentage}%`, PDF_LEFT + 8, currentY - 68, { size: 10, bold: true })
  if (invoice.igstAmount > 0) {
    addText(`IGST: INR ${invoice.igstAmount.toLocaleString('en-IN')}`, 294, currentY - 68, { size: 10 })
  } else {
    addText(`CGST: INR ${invoice.cgstAmount.toLocaleString('en-IN')}`, 294, currentY - 68, { size: 10 })
    addText(`SGST: INR ${invoice.sgstAmount.toLocaleString('en-IN')}`, 294, currentY - 82, { size: 10 })
  }
  addText(`Tax amount: INR ${invoice.taxAmount.toLocaleString('en-IN')}`, 364, currentY - 68, { size: 10 })

  addText('Total', 364, currentY - 94, { size: 10, bold: true })
  addText(`INR ${invoice.totalAmount.toLocaleString('en-IN')}`, 448, currentY - 94, { size: 11, bold: true })
  currentY -= 124

  addText(`Amount chargeable in words: ${invoice.amountInWords}`, PDF_LEFT, currentY, { size: 10, bold: true })
  currentY -= 22

  addText('Tax breakup', PDF_LEFT, currentY, { size: 12, bold: true })
  currentY -= 16
  addBox(PDF_LEFT, currentY - 62, PDF_RIGHT - PDF_LEFT, 62)
  addLine(PDF_LEFT, currentY - 20, PDF_RIGHT, currentY - 20)
  addLine(PDF_LEFT, currentY - 40, PDF_RIGHT, currentY - 40)
  addLine(220, currentY, 220, currentY - 62)
  addLine(330, currentY, 330, currentY - 62)
  addLine(440, currentY, 440, currentY - 62)
  addText('Tax type', PDF_LEFT + 8, currentY - 13, { size: 10, bold: true })
  addText('Taxable value', 232, currentY - 13, { size: 10, bold: true })
  addText('Tax amount', 342, currentY - 13, { size: 10, bold: true })
  addText('Total', 452, currentY - 13, { size: 10, bold: true })
  addText(invoice.igstAmount > 0 ? 'IGST' : 'CGST + SGST', PDF_LEFT + 8, currentY - 33, { size: 10 })
  addText(`INR ${invoice.taxableValue.toLocaleString('en-IN')}`, 232, currentY - 33, { size: 10 })
  addText(`INR ${invoice.taxAmount.toLocaleString('en-IN')}`, 342, currentY - 33, { size: 10 })
  addText(`INR ${invoice.totalAmount.toLocaleString('en-IN')}`, 452, currentY - 33, { size: 10 })
  currentY -= 82

  addText('Declaration', PDF_LEFT, currentY, { size: 12, bold: true })
  currentY -= 16
  currentY = addWrappedText(invoice.declaration, PDF_LEFT, currentY, 500, { size: 10, lineHeight: 13 })
  currentY -= 28

  addText('Company bank details', PDF_LEFT, currentY, { size: 12, bold: true })
  currentY -= 16
  addText(`Account name: ${invoice.seller.accountName}`, PDF_LEFT, currentY, { size: 10 })
  currentY -= 14
  addText(`Bank name: ${invoice.seller.bankName}`, PDF_LEFT, currentY, { size: 10 })
  currentY -= 14
  addText(`Account number: ${invoice.seller.accountNumber}`, PDF_LEFT, currentY, { size: 10 })
  currentY -= 14
  addText(`IFSC: ${invoice.seller.ifsc}`, PDF_LEFT, currentY, { size: 10 })
  currentY -= 14
  addText(`Branch: ${invoice.seller.branch}`, PDF_LEFT, currentY, { size: 10 })

  addText('For ScaleVyapar Rozgar', 390, currentY + 42, { size: 11, bold: true })
  addText('Authorised Signatory', 408, currentY - 12, { size: 10 })

  addLine(PDF_LEFT, 72, PDF_RIGHT, 72)
  addText(invoice.note, PDF_LEFT, 56, { size: 9 })

  return createPdfDocument(operators.join('\n'))
}
