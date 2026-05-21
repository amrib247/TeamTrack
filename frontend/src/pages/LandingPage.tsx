import { Link } from 'react-router-dom';
import {
  Target,
  Users,
  Trophy,
  Calendar,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingAppPreview } from '@/components/landing/LandingAppPreview';

function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex shrink-0 items-center gap-2">
            <Target className="size-8 shrink-0 text-blue-600" aria-hidden />
            <span className="text-xl font-semibold text-gray-900">TeamTrack</span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <a
              href="#features"
              className="whitespace-nowrap text-gray-600 hover:text-gray-900"
            >
              Learn More
            </a>
            <Button
              asChild
              className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Sports team management
            </p>
            <h1 className="mb-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Manage Your Teams and Tournaments with Ease
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-gray-600">
              TeamTrack is the all-in-one platform for coaches, players, and organizers to
              coordinate teams, schedule events, and run seamless tournaments.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button
                asChild
                className="h-10 bg-blue-600 px-6 text-base text-white hover:bg-blue-700"
              >
                <Link to="/auth">Start for Free</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 border-gray-300 px-6 text-base">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <LandingAppPreview />
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Team Management',
                text: 'Organize rosters, invite members, assign roles, and keep everyone connected in one place.',
              },
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                text: 'Create events, track availability, and coordinate volunteer tasks with email reminders.',
              },
              {
                icon: Trophy,
                title: 'Tournament Tools',
                text: 'Run tournaments with team registration, game scheduling, and referee assignment.',
              },
              {
                icon: MessageSquare,
                title: 'Team Chat',
                text: 'Messaging for teams and tournaments with file sharing to keep everyone in sync.',
              },
              {
                icon: CheckCircle2,
                title: 'Task Coordination',
                text: "Assign volunteer tasks with capacity limits and track who's helping out.",
              },
              {
                icon: Target,
                title: 'Role-Based Access',
                text: 'Customized views and permissions for coaches, players, referees, and organizers.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="min-w-0 border border-gray-200 bg-white p-6 shadow-sm"
              >
                <Icon className="mb-3 size-10 text-blue-600" aria-hidden />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="break-words text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">How It Works</h2>
          <div className="space-y-10">
            {[
              {
                step: '1',
                title: 'Create Your Account',
                text: 'Sign up in seconds with just your email and basic information.',
              },
              {
                step: '2',
                title: 'Build Your Teams',
                text: 'Create teams, invite members via email, and assign coach or player roles.',
              },
              {
                step: '3',
                title: 'Organize Events',
                text: 'Schedule practices, games, and volunteer tasks. Track availability automatically.',
              },
              {
                step: '4',
                title: 'Run Tournaments',
                text: 'Create tournaments, invite teams, assign referees, and manage the entire competition.',
              },
            ].map(({ step, title, text }) => (
              <div key={step} className="flex items-start gap-8">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
                  {step}
                </div>
                <div className="min-w-0">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Perfect For</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: 'Youth Leagues',
                text: 'Coordinate parent volunteers, practice schedules, and game days.',
              },
              {
                icon: Trophy,
                title: 'Tournament Organizers',
                text: 'Manage multi-team events, assign referees, and streamline communication.',
              },
              {
                icon: Target,
                title: 'Club Teams',
                text: 'Keep competitive teams organized with advanced scheduling and roster tools.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="min-w-0 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-blue-100">
                  <Icon className="size-7 text-blue-600" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Ready to Get Started?</h2>
          <p className="mb-6 text-lg text-blue-100">
            Join coaches and organizers using TeamTrack today.
          </p>
          <Button
            asChild
            className="h-10 bg-white px-6 text-base text-blue-600 hover:bg-gray-100"
          >
            <Link to="/auth">Create Your Account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} TeamTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
