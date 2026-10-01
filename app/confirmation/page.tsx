import { createClient } from '@/lib/supabase-server'
import SiteHeader from '@/components/ui/SiteHeader'
import ConfirmationCard from '@/components/ConfirmationCard'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: {
    name?: string
    event?: string
    date?: string
    event_id?: string
  }
}) {
  const name = searchParams.name || 'friend'

  // Pull the event's details so the confirmation shows what they signed up
  // for. Falls back to the title/date in the URL if the lookup finds nothing.
  let eventRow: {
    title: string
    date: string
    is_paid: boolean
    price_inr: number | null
    meeting_point_url: string | null
    distance: string | null
    pace_group: string | null
  } | null = null

  if (searchParams.event_id) {
    const supabase = createClient()
    const { data } = await supabase
      .from('events')
      .select('title, date, is_paid, price_inr, meeting_point_url, distance, pace_group')
      .eq('id', searchParams.event_id)
      .maybeSingle()
    eventRow = data
  }

  const event = eventRow?.title || searchParams.event || 'the event'
  const rawDate = eventRow?.date || searchParams.date
  const date = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  const whatsappShareText = encodeURIComponent(
    `Just signed up for ${event} with The First Rule Club! https://thefirstruleclub.vercel.app`
  )

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <ConfirmationCard
          name={name}
          event={event}
          date={date}
          whatsappShareText={whatsappShareText}
          details={
            eventRow
              ? {
                  isPaid: eventRow.is_paid,
                  price: eventRow.price_inr,
                  meetingPointUrl: eventRow.meeting_point_url,
                  distance: eventRow.distance,
                  paceGroup: eventRow.pace_group,
                }
              : undefined
          }
        />
      </div>
      </div>
    </main>
  )
}
