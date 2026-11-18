/** Escape special RegExp characters so a plain string can be used inside new RegExp(). */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
