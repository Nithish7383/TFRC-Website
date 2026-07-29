import { SupabaseClient } from '@supabase/supabase-js'

export const VIDEOS_BUCKET = 'videos'
const MAX_FILE_BYTES = 100 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/webm']

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose an MP4 or WEBM video.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Video is too large — please choose a file under 100MB.'
  }
  return null
}

/** Uploads a validated video under `folder/` and returns its public URL. */
export async function uploadVideo(
  supabase: SupabaseClient,
  file: File,
  folder: string
): Promise<{ url: string } | { error: string }> {
  const validationError = validateVideoFile(file)
  if (validationError) return { error: validationError }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { error: 'Upload failed. Please try again.' }
  }

  const { data } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}
