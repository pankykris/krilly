/// <reference types="vite/client" />

export type KrillyArtifact = {
  title: string;
  kind:
    | "text"
    | "markdown"
    | "code"
    | "table"
    | "notes"
    | "mermaid"
    | "image"
    | "imageLoading"
    | "thumbnailBoard"
    | "progress";
  content: string;
  language?: string;
  fullscreen?: boolean;
};

export type KrillyToolSpec = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type KrillyToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type KrillyToolResult = {
  ok: boolean;
  artifact?: KrillyArtifact;
  mode?: "display" | "computer";
  message?: string;
  error?: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    krilly: {
      createRealtimeToken: () => Promise<{ value: string; expiresAt: number | null }>;
      executeTool: (toolCall: KrillyToolCall) => Promise<KrillyToolResult>;
      getToolSpecs: () => Promise<KrillyToolSpec[]>;
    };
  }
}
