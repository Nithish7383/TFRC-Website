import { createClient } from '@/lib/supabase-server'
import { Event } from '@/lib/types'
import RegisterForm from '@/components/RegisterForm'

interface EventWithCounts extends Event {
  male_count: number
  female_count: number
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { event?: string }
}) {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true })

  const eventsWithCounts: EventWithCounts[] = await Promise.all(
    ((events as Event[]) || []).map(async (event) => {
      const { count: maleCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('gender', 'Male')

      const { count: femaleCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('gender', 'Female')

      return {
        ...event,
        male_count: maleCount ?? 0,
        female_count: femaleCount ?? 0,
      }
    })
  )

  return (
    <main className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <a href="/" className="text-gray-500 text-sm hover:text-gray-300 block mb-6">
            ← Back to home
          </a>
          <p className="eyebrow mb-2 justify-center w-full">Entry open</p>
          <h1 className="heading-display text-white text-4xl mb-2">Register for an Event</h1>
          <p className="text-gray-400">Fill in your details to secure your spot.</p>
        </div>
        <RegisterForm
          events={eventsWithCounts}
          preselectedEventId={searchParams.event}
        />
      </div>
    </main>
  )
}
