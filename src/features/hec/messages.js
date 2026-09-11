// Keep parser errors usable by CLI consumers that expect legacy Chinese messages.
export class HecError extends Error {
  constructor(zh, en) {
    super(zh);
    this.name = 'HecError';
    this.messages = Object.freeze({ zh, en });
  }
}

export function errorMessage(error, locale = 'zh') {
  if (error instanceof HecError) return error.messages[locale === 'zh' ? 'zh' : 'en'];
  return error instanceof Error ? error.message : String(error);
}
