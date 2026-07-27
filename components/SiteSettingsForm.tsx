'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SiteSetting } from '@/lib/types'
import HomepageGalleryManager from '@/components/HomepageGalleryManager'

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
  const [q1text, setQ1text] = useState(init['quote_1_text'] ?? '')
  const [q1name, setQ1name] = useState(init['quote_1_name'] ?? '')
  const [q2text, setQ2text] = useState(init['quote_2_text'] ?? '')
  const [q2name, setQ2name] = useState(init['quote_2_name'] ?? '')
  const [q3text, setQ3text] = useState(init['quote_3_text'] ?? '')
  const [q3name, setQ3name] = useState(init['quote_3_name'] ?? '')

  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

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

      {/* Section 5 — Gallery */}
      <div className="card space-y-4">
        <h3 className="text-white font-semibold">Homepage Gallery</h3>
        <HomepageGalleryManager />
      </div>
    </div>
  )
}
