export const buildWhatsAppLink = (number: string, message: string) => {
  const digits = number.replace(/\D+/g, '')
  if (!digits) {
    return ''
  }

  const encodedMessage = encodeURIComponent(message.trim())
  return encodedMessage ? `https://wa.me/${digits}?text=${encodedMessage}` : `https://wa.me/${digits}`
}
