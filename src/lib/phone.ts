export function normalizeVietnamPhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (/^0\d{9}$/.test(compact)) return `+84${compact.slice(1)}`;
  if (/^84\d{9}$/.test(compact)) return `+${compact}`;
  if (/^\+84\d{9}$/.test(compact)) return compact;
  return null;
}
