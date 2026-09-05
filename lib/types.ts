export type Role = 'u' | 'a';
export type MsgType = 'text' | 'image';

export interface ChatMsg {
  r: Role;
  c: string;
  /** 'image' kalau c berisi data URL hasil generate gambar (default: 'text') */
  t?: MsgType;
  /** prompt/caption asli buat pesan bertipe image */
  cap?: string;
}

export interface Conversation {
  msgs: ChatMsg[];
  ts: number;
}

export type ConversationStore = Record<string, Conversation>;
