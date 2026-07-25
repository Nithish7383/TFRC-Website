export function buildWhatsAppMessage(groupLink: string): string {
  return `🎉 Congrats! You are selected for this weekend run! Join the group here: ${groupLink}`
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
