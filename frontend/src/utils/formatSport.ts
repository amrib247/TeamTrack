export function formatSportName(sport: string): string {
  if (!sport) return 'Unknown Sport';
  if (sport.toLowerCase() === 'track & field') return 'Track & Field';
  return sport
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
