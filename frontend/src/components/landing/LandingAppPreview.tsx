import LandingIcon from './LandingIcon';

/** Static mock UI window for the marketing hero (non-interactive). */
export function LandingAppPreview() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-lg"
      aria-hidden
    >
      <div className="flex items-center gap-3 rounded-t-md border-b border-blue-100 bg-blue-50 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-red-300" />
          <span className="size-2 rounded-full bg-amber-300" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-blue-800">TeamTrack</span>
      </div>
      <div className="flex min-h-[280px] bg-white">
        <div className="flex flex-col gap-1 border-r border-gray-200 bg-blue-50/80 p-2">
          {(['users', 'calendar', 'message', 'check', 'trophy'] as const).map((name, i) => (
            <div
              key={name}
              className={`flex size-9 items-center justify-center rounded border ${
                i === 0
                  ? 'border-gray-200 bg-white text-blue-700'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <LandingIcon name={name} size={18} />
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-3">
          <div className="space-y-1.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-gray-500">
              Upcoming
            </p>
            <div className="flex items-center gap-2 rounded border border-l-[3px] border-gray-200 border-l-teal-500 bg-teal-50 px-2 py-1.5 text-xs text-gray-800">
              <LandingIcon name="calendar" size={16} />
              <span>Practice · Tue 6:00 PM</span>
            </div>
            <div className="flex items-center gap-2 rounded border border-l-[3px] border-gray-200 border-l-amber-500 bg-amber-50 px-2 py-1.5 text-xs text-gray-800">
              <LandingIcon name="trophy" size={16} />
              <span>League game · Sat 2:00 PM</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-gray-500">
              Team chat
            </p>
            <div className="flex items-center gap-2 rounded border border-l-[3px] border-gray-200 border-l-violet-500 bg-violet-50 px-2 py-1.5 text-xs text-gray-600">
              <LandingIcon name="message" size={16} />
              <span>Coach: Bring cleats for Saturday</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-gray-500">
              Tasks
            </p>
            <div className="flex items-center gap-2 rounded border border-l-[3px] border-gray-200 border-l-green-600 bg-green-50 px-2 py-1.5 text-xs text-gray-800">
              <LandingIcon name="check" size={16} />
              <span>Snack signup · 3 of 8 spots filled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
