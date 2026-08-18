export type Role = 'u' | 'a';

export interface ChatMsg {
  r: Role;
  c: string;
}

export interface Conversation {
  msgs: ChatMsg[];
  ts: number;
}

export type ConversationStore = Record<string, Conversation>;
