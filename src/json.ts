/**
 * JSON parsing helpers that revive ISO-8601 datetime strings into `Date`
 * objects. The Paycrest API returns timestamps as ISO-8601 strings (e.g.
 * `2026-06-21T00:00:00Z`); these helpers turn them into `Date` so the typed
 * `Date` fields on response models hold real dates at runtime.
 */

/** Matches ISO-8601 *datetime* values (date + time), not bare `YYYY-MM-DD`. */
const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATETIME.test(value)) {
    const ms = Date.parse(value);
    if (!Number.isNaN(ms)) return new Date(ms);
  }
  return value;
}

/** `JSON.parse` that revives ISO-8601 datetime strings into `Date` objects. */
export function parseJson(text: string): unknown {
  return JSON.parse(text, dateReviver);
}

/** Like {@link parseJson}, but returns the raw string if parsing fails. */
export function safeParseJson(text: string): unknown {
  try {
    return parseJson(text);
  } catch {
    return text;
  }
}
