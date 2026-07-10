import { PageHero } from '../components/PageHero';
import { PageSection } from '../components/PageSection';
import { PublicMeetingsCalendar } from '../components/PublicMeetingsCalendar';

const MEETINGS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80';

export function MeetingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Agenda"
        title="Nos réunions"
        description="Assemblées statutaires, conférences et événements du Rotary Club Le Nautile Patronat."
        imageUrl={MEETINGS_HERO_IMAGE}
      />

      <PageSection className="pt-10 pb-20">
        <PublicMeetingsCalendar />
      </PageSection>
    </>
  );
}
