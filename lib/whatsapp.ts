export function buildWhatsAppMessage(groupLink: string): string {
  return `🎉 Congrats! You are selected for the upcoming TFRC event! Join the group here: ${groupLink}`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
