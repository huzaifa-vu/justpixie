// A singleton state store to hand off Files and Configuration parameters 
// across routes without hitting any external servers. This preserves Local-First architecture.

export interface AiTransferState {
  targetRoute: string | null;
  files: File[];
  params: Record<string, string>;
  autoExecute: boolean;
}

let aiStore: AiTransferState = {
  targetRoute: null,
  files: [],
  params: {},
  autoExecute: false
};

// Handlers for interacting with the cache
export const getAiState = () => aiStore;

export const setAiState = (newState: Partial<AiTransferState>) => {
  aiStore = { ...aiStore, ...newState };
};

export const clearAiState = () => {
  aiStore = {
    targetRoute: null,
    files: [],
    params: {},
    autoExecute: false
  };
};
