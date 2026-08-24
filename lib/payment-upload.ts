import { SupabaseClient } from '@supabase/supabase-js'
import { validatePhotoFile } from '@/lib/photo-upload'

export const PAYMENT_SCREENSHOTS_BUCKET = 'payment-screenshots'

/** Uploads a payment screenshot under payments/ and returns its public URL + storage path.
 * Mirrors lib/photo-upload.ts's uploadPhoto() but targets the payment-screenshots
 * bucket, which allows anonymous INSERT (registrants aren't authenticated) —
 * unlike the photos bucket, which is admin-only. See supabase-v14-paid-events.sql. */
export async function uploadPaymentScreenshot(
  supabase: SupabaseClient,
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  const validationError = validatePhotoFile(file)
  if (validationError) return { error: validationError }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `payments/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_SCREENSHOTS_BUCKET)
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { error: 'Upload failed. Please try again.' }
  }

  const { data } = supabase.storage.from(PAYMENT_SCREENSHOTS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}
