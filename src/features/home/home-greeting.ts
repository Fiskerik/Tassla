export function homeGreetingAt(date: Date): string {
  const hour = date.getHours();
  if (!Number.isFinite(date.getTime()) || hour < 0 || hour > 23) return 'Hej!';
  if (hour >= 5 && hour < 11) return 'God morgon!';
  if (hour >= 18 && hour < 22) return 'God kväll!';
  return 'Hej!';
}
