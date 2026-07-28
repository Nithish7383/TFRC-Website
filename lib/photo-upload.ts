import { SupabaseClient } from '@supabase/supabase-js'

export const PHOTOS_BUCKET = 'photos'
const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, or WEBP image.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Image is too large — please choose a file under 5MB.'
  }
  return null
}

/** Uploads a validated file under `folder/` and returns its public URL + storage path. */
export async function uploadPhoto(
  supabase: SupabaseClient,
  file: File,
  folder: string
): Promise<{ url: string; path: string } | { error: string }> {
  const validationError = validatePhotoFile(file)
  if (validationError) return { error: validationError }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { error: 'Upload failed. Please try again.' }
  }

  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** Best-effort — skips silently if there's no path (legacy external-URL row) or the file is already gone. */
export async function deletePhotoFile(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return
  await supabase.storage.from(PHOTOS_BUCKET).remove([path])
}
