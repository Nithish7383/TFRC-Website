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

export function normalizePhone(raw: string): string {
  return raw
    .replace(/\s|-/g, '')
    .replace(/^\+91/, '')
    .replace(/^0/, '')
    .trim()
}
