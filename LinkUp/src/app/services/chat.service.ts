import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private conversations: any[] = [];
  private messageStore: Record<string, any[]> = {};

  constructor(private http: HttpClient) {}

  private mapChat(chat: any): any {
    const chatId = chat?.id_chat ?? chat?.id ?? 0;
    const interlocutorId = chat?.id_interlocutor ?? chat?.userId ?? chat?.id_usuario ?? chatId;

    const rawName =
      chat?.nombre_usuario_interlocutor ??
      chat?.nombre_usuario ??
      chat?.username ??
      chat?.usuario?.nombre_usuario ??
      chat?.usuario?.username ??
      chat?.interlocutor?.nombre_usuario ??
      chat?.interlocutor?.username ??
      chat?.nombre_interlocutor ??
      chat?.name ??
      'Usuario';

    const name = String(rawName || 'Usuario').trim() || 'Usuario';
    const avatar =
      chat?.foto_interlocutor ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
    const lastMessage = chat?.ultimo_mensaje || '';
    const timeValue = chat?.fecha_ultimo_mensaje
      ? new Date(chat.fecha_ultimo_mensaje).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Ahora';

    return {
      id: String(chatId),
      name,
      avatar,
      lastMessage,
      time: timeValue,
      unread: 0,
      userId: String(interlocutorId),
    };
  }

  fetchConversations(): Observable<any[]> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser?.id) {
      this.conversations = [];
      return of([]);
    }

    return this.http
      .get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/chats`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          const rawChats = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

          console.log('[ChatService] payload bruto recibido:', rawChats);

          const chats = rawChats.map((chat) => this.mapChat(chat));
          this.conversations = chats;
          return chats;
        }),
        catchError((error) => {
          console.error('Error cargando chats:', error);
          this.conversations = [];
          return of([]);
        }),
      );
  }

  getConversations(userId: string): any[] {
    return this.conversations;
  }

  getConversation(id: string): any {
    return this.conversations.find((c) => String(c.id) === String(id));
  }

  createConversationFromSuggestion(user: { id: string; firstName: string; lastName: string; avatar?: string }): any {
    const conversationId = String(user.id);
    const existing = this.getConversation(conversationId);
    if (existing) return existing;

    const conversation = {
      id: conversationId,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario',
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario')}&background=6366f1&color=fff`,
      lastMessage: '',
      time: 'Ahora',
      unread: 0,
      userId: String(user.id),
    };

    this.conversations.unshift(conversation);
    return conversation;
  }

  getMessages(conversationId: string): any[] {
    const key = String(conversationId);
    if (!this.messageStore[key]) {
      this.messageStore[key] = [];
    }
    return this.messageStore[key];
  }

  sendMessage(conversationId: string, message: any): void {
    const key = String(conversationId);
    if (!this.messageStore[key]) {
      this.messageStore[key] = [];
    }
    this.messageStore[key].push(message);

    const conv = this.conversations.find((c) => String(c.id) === String(conversationId));
    if (conv) {
      conv.lastMessage = message.text;
      conv.time = message.time;
    }
  }
}