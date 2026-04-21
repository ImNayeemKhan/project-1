// Escape regex metacharacters in user-supplied input before handing it to
// `new RegExp()`. Prevents regex injection / ReDoS-style patterns being
// smuggled into MongoDB queries.
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
