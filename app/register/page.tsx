import { createClient } from '@/lib/supabase-server'
import { Event, Question } from '@/lib/types'
import RegisterForm from '@/components/RegisterForm'
import SiteHeader from '@/components/ui/SiteHeader'

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
      const [{ count: maleCount }, { count: femaleCount }, { data: customQuestions }, { data: defaultQuestions }] = await Promise.all([
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('gender', 'Male'),
        supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('gender', 'Female'),
        supabase
          .from('questions')
          .select('*')
          .eq('event_id', event.id)
          .order('order_index', { ascending: true }),
        event.event_type
          ? supabase
              .from('questions')
              .select('*')
              .eq('event_type', event.event_type)
              .eq('is_default', true)
              .order('order_index', { ascending: true })
          : Promise.resolve({ data: [] as Question[] }),
      ])

      return {
        ...event,
        male_count: maleCount ?? 0,
        female_count: femaleCount ?? 0,
        questions: [...((defaultQuestions as Question[]) || []), ...((customQuestions as Question[]) || [])],
      }
    })
  )

  return (
    <main className="min-h-screen bg-black">
      <SiteHeader />
      <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="eyebrow mb-2 justify-center w-full">Entry open</p>
          <h1 className="heading-display text-white text-4xl mb-2">Register for an Event</h1>
          <p className="text-gray-400">Fill in your details to secure your spot.</p>
        </div>
        <RegisterForm
          events={eventsWithCounts}
          preselectedEventId={searchParams.event}
        />
      </div>
      </div>
    </main>
  )
}
