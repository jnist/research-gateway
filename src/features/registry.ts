import Explorer from './hec/Explorer.astro';

export const tools = { hec: Explorer };
export type ToolId = keyof typeof tools;
