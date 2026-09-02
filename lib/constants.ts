export const TFRC_LOCATION = 'Madurai, Tamil Nadu'

export const GOALS_OPTIONS = [
  'Improve fitness',
  'Lose weight',
  'Meet new people',
  'Build consistency',
  'Prepare for races',
  'Explore Madurai',
  'Stress relief',
  'Just curious',
]

export const INTERESTS_OPTIONS = [
  'Running',
  'Trekking',
  'Cycling',
  'Strength Training',
  'Yoga',
  'Boxing',
  'Photography',
  'Content Creation',
  'Volunteering',
]

export const REASON_OPTIONS = [
  'First running event',
  'Fitness goal',
  'Meet community',
  'Challenge myself',
  'Friend invited me',
  'Regular runner',
  'Other',
]

export const EXPERIENCE_OPTIONS = [
  'First timer',
  'Casual',
  'Regular',
  'Competitive',
] as const

/** Strips formatting/country-code noise down to a bare 10-digit Indian
 * mobile number — this is the only phone format stored anywhere in the
 * app, so every wa.me link can safely prefix it with 91. */
export function normalizePhone(raw: string): string {
  const digitsOnly = raw.replace(/[^\d]/g, '')
  // Strip a leading 91 country code only when it leaves exactly 10 digits
  // behind (e.g. "919876543210" -> "9876543210"), so a genuine 10-digit
  // number that happens to start with 91 (e.g. "9198765432") is untouched.
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2)
  }
  // Strip a single leading trunk-prefix 0 (e.g. "09876543210").
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.slice(1)
  }
  return digitsOnly
}
