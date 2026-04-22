// Minimal HTML escape for interpolating user-controlled strings into raw
// HTML templates (e.g. the invoice print page). Covers the standard set
// of characters that matter for HTML contexts: `&`, `<`, `>`, `"`, `'`.
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
