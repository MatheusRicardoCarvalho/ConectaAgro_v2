import { MessageUpsertType } from "@whiskeysockets/baileys";

export type TokenPayload = {
    app: AuthorizedApp;
    iat: number;
    exp: number
}

export interface AuthorizedApp {
    app: string;
    key: string;
}

interface Key {
    remoteJid: string;
    fromMe: boolean;
  }

interface Message {
    conversation: string;
  }
  
  interface MessagesItem {
    message: Message;
  }
  
export  interface ExtendedMessagesItem extends MessagesItem {
    key: Key;
    userId: string;
    app: boolean
  }

  export interface SendMessage {
    messages: MessagesItem[];
    type: MessageUpsertType;
    appId: number
    cpf: string
  }

  export interface ExtendedSendMessage extends SendMessage {
    messages: ExtendedMessagesItem[];
  }