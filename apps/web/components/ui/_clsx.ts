// Minimal `clsx` replacement. We don't want to add a dep for 10 lines.
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
