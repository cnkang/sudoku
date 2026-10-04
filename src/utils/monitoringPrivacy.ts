/** Monitoring never needs query strings, fragments, or URL credentials. */
export function monitoringUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
}

export function monitoringMessage(value: string): string {
  return value.replace(/https?:\/\/[^\s)]+/g, (url) => monitoringUrl(url));
}
