import SiteHeader from '@/components/ui/SiteHeader'
import ConfirmationCard from '@/components/ConfirmationCard'

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: {
    name?: string
    event?: string
    date?: string
  }
}) {
  const name = searchParams.name || 'Runner'
  const event = searchParams.event || 'the event'
  const date = searchParams.date
    ? new Date(searchParams.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  const whatsappShareText = encodeURIComponent(
    `Just signed up for ${event} with The First Rule Club! 🏃 first-rule-club.vercel.app`
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
        />
      </div>
      </div>
    </main>
  )
}
