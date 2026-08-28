'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { SiteSetting } from '@/lib/types'
import HomepageGalleryManager from '@/components/HomepageGalleryManager'
import { uploadVideo, deleteVideoFile } from '@/lib/video-upload'
import { uploadPhoto, deletePhotoFile } from '@/lib/photo-upload'

function pathFromPublicUrl(url: string): string | null {
  const marker = '/object/public/'
  const i = url.indexOf(marker)
  if (i === -1) return null
  const rest = url.slice(i + marker.length)
  return rest.split('/').slice(1).join('/') || null
}

interface Props {
  settings: SiteSetting[]
}

async function upsert(supabase: ReturnType<typeof createClient>, pairs: Record<string, string>) {
  const rows = Object.entries(pairs).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  return supabase.from('site_settings').upsert(rows)
}

export default function SiteSettingsForm({ settings }: Props) {
  const supabase = createClient()
  const init = Object.fromEntries(settings.map((r) => [r.key, r.value]))

  // Section states
  const [statValue, setStatValue] = useState(init['community_stat_value'] ?? '')
  const [whatsapp, setWhatsapp] = useState(init['whatsapp_link'] ?? '')
  const [instagram, setInstagram] = useState(init['instagram_url'] ?? '')
  const [youtube, setYoutube] = useState(init['youtube_url'] ?? '')
  const [featActive, setFeatActive] = useState(init['featured_event_active'] === 'true')
  const [featName, setFeatName] = useState(init['featured_event_name'] ?? '')
  const [featDate, setFeatDate] = useState(init['featured_event_date'] ?? '')
  const [featDesc, setFeatDesc] = useState(init['featured_event_desc'] ?? '')
  const [featUrl, setFeatUrl] = useState(init['featured_event_url'] ?? '')
  const [featBtn, setFeatBtn] = useState(init['featured_event_btn'] ?? 'Register Now')
  const [featImage, setFeatImage] = useState(init['featured_event_image_url'] ?? '')
  const [uploadingFeatImage, setUploadingFeatImage] = useState(false)
  const [featImageError, setFeatImageError] = useState('')
  const featImageInputRef = useRef<HTMLInputElement>(null)
  const [q1text, setQ1text] = useState(init['quote_1_text'] ?? '')
  const [q1name, setQ1name] = useState(init['quote_1_name'] ?? '')
  const [q2text, setQ2text] = useState(init['quote_2_text'] ?? '')
  const [q2name, setQ2name] = useState(init['quote_2_name'] ?? '')
  const [q3text, setQ3text] = useState(init['quote_3_text'] ?? '')
  const [q3name, setQ3name] = useState(init['quote_3_name'] ?? '')

  const [paymentQr, setPaymentQr] = useState(init['payment_qr_code_url'] ?? '')
  const [uploadingQr, setUploadingQr] = useState(false)
  const [qrUploadError, setQrUploadError] = useState('')
  const qrFileInputRef = useRef<HTMLInputElement>(null)

  const [heroVideoMobile, setHeroVideoMobile] = useState(init['hero_video_mobile_url'] ?? '')
  const [heroVideoDesktop, setHeroVideoDesktop] = useState(init['hero_video_desktop_url'] ?? '')
  const [uploadingVideo, setUploadingVideo] = useState<'mobile' | 'desktop' | null>(null)
  const [videoUploadError, setVideoUploadError] = useState('')
  const mobileVideoInputRef = useRef<HTMLInputElement>(null)
  const desktopVideoInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const handleVideoUpload = async (slot: 'mobile' | 'desktop', file: File) => {
    setUploadingVideo(slot)
    setVideoUploadError('')

    const result = await uploadVideo(supabase, file, 'hero')

    setUploadingVideo(null)

    if ('error' in result) {
      setVideoUploadError(result.error)
      return
    }

    const key = slot === 'mobile' ? 'hero_video_mobile_url' : 'hero_video_desktop_url'
    if (slot === 'mobile') setHeroVideoMobile(result.url)
    else setHeroVideoDesktop(result.url)

    await upsert(supabase, { [key]: result.url })
    setSaved('hero-video')
    setTimeout(() => setSaved(null), 2000)
  }

  const handleVideoRemove = async (slot: 'mobile' | 'desktop') => {
    const url = slot === 'mobile' ? heroVideoMobile : heroVideoDesktop
    const key = slot === 'mobile' ? 'hero_video_mobile_url' : 'hero_video_desktop_url'

    if (slot === 'mobile') setHeroVideoMobile('')
    else setHeroVideoDesktop('')

    await upsert(supabase, { [key]: '' })
    await deleteVideoFile(supabase, pathFromPublicUrl(url))

    setSaved('hero-video')
    setTimeout(() => setSaved(null), 2000)
  }

  const handleFeatImageUpload = async (file: File) => {
    setUploadingFeatImage(true)
    setFeatImageError('')

    const result = await uploadPhoto(supabase, file, 'featured-event')

    setUploadingFeatImage(false)

    if ('error' in result) {
      setFeatImageError(result.error)
      return
    }

    setFeatImage(result.url)
    await upsert(supabase, { featured_event_image_url: result.url })
    setSaved('featured-image')
    setTimeout(() => setSaved(null), 2000)
  }

  const handleFeatImageRemove = async () => {
    const url = featImage
    setFeatImage('')
    await upsert(supabase, { featured_event_image_url: '' })
    await deletePhotoFile(supabase, pathFromPublicUrl(url))
    setSaved('featured-image')
    setTimeout(() => setSaved(null), 2000)
  }

  const handleQrUpload = async (file: File) => {
    setUploadingQr(true)
    setQrUploadError('')

    const result = await uploadPhoto(supabase, file, 'payment-qr')

    setUploadingQr(false)

    if ('error' in result) {
      setQrUploadError(result.error)
      return
    }

    setPaymentQr(result.url)
    await upsert(supabase, { payment_qr_code_url: result.url })
    setSaved('payment-qr')
    setTimeout(() => setSaved(null), 2000)
  }

  const save = async (section: string, pairs: Record<string, string>) => {
    setSaving(section)
    setSaved(null)
    await upsert(supabase, pairs)
    setSaving(null)
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  const SaveBtn = ({ section }: { section: string }) => (
    <button
      onClick={() => {
        if (section === 'stat') save('stat', { community_stat_value: statValue })
        else if (section === 'social') save('social', { whatsapp_link: whatsapp, instagram_url: instagram, youtube_url: youtube })
        else if (section === 'featured') save('featured', {
          featured_event_active: String(featActive),
          featured_event_name: featName,
          featured_event_date: featDate,
          featured_event_desc: featDesc,
          featured_event_url: featUrl,
          featured_event_btn: featBtn,
        })
        else if (section === 'quotes') save('quotes', {
          quote_1_text: q1text, quote_1_name: q1name,
          quote_2_text: q2text, quote_2_name: q2name,
          quote_3_text: q3text, quote_3_name: q3name,
        })
      }}
      disabled={saving === section}
      className="btn-primary text-sm py-2 px-5"
    >
      {saving === section ? 'Saving...' : saved === section ? 'Saved ✓' : 'Save'}
    </button>
  )

  return (
    <div className="space-y-8">
      {/* Section 1 — Community Stat */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Community Stat</h3>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Displayed on homepage (e.g. &quot;1600+&quot;)</label>
          <input
            type="text"
            value={statValue}
            onChange={(e) => setStatValue(e.target.value)}
            placeholder="1600+"
            className="input-field"
          />
        </div>
        <SaveBtn section="stat" />
      </div>

      {/* Section 2 — Social Links */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Social Links</h3>
        <div>
          <label className="block text-gray-400 text-xs mb-1">WhatsApp Invite URL</label>
          <input
            type="url"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Instagram URL</label>
          <input
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/..."
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">YouTube URL (leave blank to hide)</label>
          <input
            type="url"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/..."
            className="input-field"
          />
        </div>
        <SaveBtn section="social" />
      </div>

      {/* Section 3 — Featured Event */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Featured Event</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={featActive}
            onChange={(e) => setFeatActive(e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          <span className="text-gray-300 text-sm">Show featured event banner on homepage</span>
        </label>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Banner Image (optional)</label>
          {featImage && (
            <div className="mb-2">
              <img src={featImage} alt="Featured event" className="w-full h-40 object-cover rounded-lg border border-white/10 mb-2" />
              <button type="button" onClick={handleFeatImageRemove} className="text-red-400 hover:text-red-300 text-xs">
                Remove image
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={featImageInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFeatImageUpload(file)
            }}
            disabled={uploadingFeatImage}
            className="input-field text-sm"
          />
          {uploadingFeatImage && <p className="text-gold text-xs mt-1">Uploading...</p>}
          {featImageError && <p className="text-red-400 text-xs mt-1">{featImageError}</p>}
          {saved === 'featured-image' && <p className="text-green-400 text-xs mt-1">Saved ✓</p>}
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Event Name</label>
          <input type="text" value={featName} onChange={(e) => setFeatName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Date (display text, e.g. &quot;July 20, 2026&quot;)</label>
          <input type="text" value={featDate} onChange={(e) => setFeatDate(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Short Description</label>
          <textarea value={featDesc} onChange={(e) => setFeatDesc(e.target.value)} rows={2} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Registration URL</label>
          <input type="url" value={featUrl} onChange={(e) => setFeatUrl(e.target.value)} placeholder="https://..." className="input-field" />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Button Text</label>
          <input type="text" value={featBtn} onChange={(e) => setFeatBtn(e.target.value)} className="input-field" />
        </div>
        <SaveBtn section="featured" />
      </div>

      {/* Section 4 — Quotes */}
      <div className="card space-y-5">
        <h3 className="text-white font-semibold">Member Voices (Quotes)</h3>
        {[
          { num: 1, text: q1text, name: q1name, setText: setQ1text, setName: setQ1name },
          { num: 2, text: q2text, name: q2name, setText: setQ2text, setName: setQ2name },
          { num: 3, text: q3text, name: q3name, setText: setQ3text, setName: setQ3name },
        ].map(({ num, text, name, setText, setName }) => (
          <div key={num} className="space-y-2 border border-white/10 rounded-lg p-4">
            <p className="text-gray-400 text-xs font-medium">Quote {num}</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Quote text..."
              className="input-field resize-none"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Member name"
              className="input-field"
            />
          </div>
        ))}
        <SaveBtn section="quotes" />
      </div>

      {/* Section 3.5 — Payments */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Payments</h3>
        <p className="text-gray-500 text-xs">
          One QR code, shown on the registration form for any event marked as paid.
          Each paid event sets its own price separately when it&apos;s created or edited.
        </p>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Payment QR Code</label>
          {paymentQr && (
            <img src={paymentQr} alt="Payment QR code" className="w-40 h-40 object-contain rounded-lg border border-white/10 mb-2 bg-white p-2" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={qrFileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleQrUpload(file)
            }}
            disabled={uploadingQr}
            className="input-field text-sm"
          />
          {uploadingQr && <p className="text-gold text-xs mt-1">Uploading...</p>}
          {qrUploadError && <p className="text-red-400 text-xs mt-1">{qrUploadError}</p>}
          {saved === 'payment-qr' && <p className="text-green-400 text-xs mt-1">Saved ✓</p>}
        </div>
      </div>

      {/* Section 4.5 — Hero Video */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Hero Background Video</h3>
        <p className="text-gray-500 text-xs">
          Upload two crops of the same footage — a portrait crop for mobile and a
          landscape crop for desktop. Until both are uploaded, the hero falls back
          to the existing rotating photo background.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-gray-400 text-xs mb-1">Mobile (portrait) video</label>
            {heroVideoMobile && (
              <div className="space-y-1">
                <video src={heroVideoMobile} className="w-full rounded-lg border border-white/10" muted controls />
                <button type="button" onClick={() => handleVideoRemove('mobile')} className="text-red-400 hover:text-red-300 text-xs">
                  Remove video
                </button>
              </div>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm"
              ref={mobileVideoInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleVideoUpload('mobile', file)
              }}
              className="input-field text-sm"
            />
            {uploadingVideo === 'mobile' && <p className="text-gold text-xs">Uploading...</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-gray-400 text-xs mb-1">Desktop (landscape) video</label>
            {heroVideoDesktop && (
              <div className="space-y-1">
                <video src={heroVideoDesktop} className="w-full rounded-lg border border-white/10" muted controls />
                <button type="button" onClick={() => handleVideoRemove('desktop')} className="text-red-400 hover:text-red-300 text-xs">
                  Remove video
                </button>
              </div>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm"
              ref={desktopVideoInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleVideoUpload('desktop', file)
              }}
              className="input-field text-sm"
            />
            {uploadingVideo === 'desktop' && <p className="text-gold text-xs">Uploading...</p>}
          </div>
        </div>

        {videoUploadError && <p className="text-red-400 text-sm">{videoUploadError}</p>}
        {saved === 'hero-video' && <p className="text-green-400 text-sm">Saved ✓</p>}
      </div>

      {/* Section 5 — Gallery */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Homepage Gallery</h3>
        <HomepageGalleryManager />
      </div>
    </div>
  )
}
