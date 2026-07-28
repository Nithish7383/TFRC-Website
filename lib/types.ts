export type Gender = 'Male' | 'Female'
export type RegistrationStatus = 'pending' | 'selected' | 'rejected'

export interface Event {
  id: string
  title: string
  date: string
  max_male: number
  max_female: number
  group_link: string | null
  is_active: boolean
  created_at: string
  registration_deadline?: string | null
  meeting_point_url?: string | null
  distance?: string | null
  pace_group?: string | null
  cover_image_url?: string | null
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
  admin_notes?: string | null
  attended?: boolean
  running_experience?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
}

export interface RegistrationWithEvent extends Registration {
  events: Event
}

export interface Member {
  id: string
  member_id: string
  member_number: number
  name: string
  phone: string
  age: number
  gender: 'Male' | 'Female'
  place: string
  occupation: string
  running_experience: 'First timer' | 'Casual' | 'Regular' | 'Competitive'
  goals: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_conditions?: string
  blood_group?: string
  instagram_handle?: string
  profile_photo_url?: string
  birthday?: string
  height?: number
  weight?: number
  running_pace?: string
  weekly_training_days?: number
  interests: string[]
  attended_count: number
  created_at: string
  auth_user_id?: string | null
}

export interface EventPhoto {
  id: string
  event_id: string
  image_url: string
  caption?: string
  instagram_post_url?: string
  display_order: number
  created_at: string
  storage_path?: string | null
}

export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export interface GalleryPhoto {
  id: string
  image_url: string
  caption?: string
  display_order: number
  created_at: string
  storage_path?: string | null
}
