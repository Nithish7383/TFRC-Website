export type Gender = 'Male' | 'Female' | 'Other'
export type RegistrationStatus = 'pending' | 'selected' | 'rejected'

export interface Event {
  id: string
  title: string
  date: string
  max_participants: number
  group_link: string
  is_active: boolean
  created_at: string
}

export interface Registration {
  id: string
  event_id: string
  name: string
  age: number
  place: string
  phone: string
  gender: Gender
  occupation: string
  reason: string
  status: RegistrationStatus
  created_at: string
  events?: Event
}

export interface EventWithCount extends Event {
  registration_count: number
}
