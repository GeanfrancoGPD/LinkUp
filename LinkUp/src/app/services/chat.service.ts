import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private conversations: any[] = [];
  private readonly demoConversations = [
    {
      id: 'conv-demo-1',
      name: 'Sarah Jenkins',
      avatar: 'https://picsum.photos/seed/demo-chat-1/400/400',
      lastMessage: 'Looking forward to our meeting tomorrow.',
      time: '12:45 PM',
      unread: 2,
      userId: 'demo-friend-3'
    },
    {
      id: 'conv-demo-2',
      name: 'Marcus Chen',
      avatar: 'https://picsum.photos/seed/demo-chat-2/400/400',
      lastMessage: 'Did you see the new design specs?',
      time: '10:12 AM',
      unread: 0,
      userId: 'demo-friend-4'
    },
    {
      id: 'conv-demo-3',
      name: 'Elena Rodríguez',
      avatar: 'https://picsum.photos/seed/demo-chat-3/400/400',
      lastMessage: 'Thanks for the update. See you soon!',
      time: 'Yesterday',
      unread: 1,
      userId: 'demo-friend-1'
    }
  ];

  constructor() {
    this.initConversations();
  }

  private initConversations(): void {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const others = users.filter((u: any) => u && u.id !== current?.id);
    const mappedUsers = others.slice(0, 5).map((u: any) => {
      const firstName = u.firstName || 'Usuario';
      const lastName = u.lastName || '';
      return {
        id: 'conv-' + u.id,
        name: `${firstName} ${lastName}`.trim() || 'Usuario',
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=6366f1&color=fff`,
        lastMessage: '¡Hola! ¿Cómo estás?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: Math.floor(Math.random() * 3),
        userId: u.id
      };
    });

    this.conversations = mappedUsers.length > 0 ? mappedUsers : [...this.demoConversations];
  }

  getConversations(userId: string): any[] {
    return this.conversations;
  }

  getConversation(id: string): any {
    return this.conversations.find(c => c.id === id);
  }

  createConversationFromSuggestion(user: { id: string; firstName: string; lastName: string; avatar?: string }): any {
    const conversationId = 'conv-' + user.id;
    const existing = this.getConversation(conversationId);
    if (existing) return existing;

    const conversation = {
      id: conversationId,
      name: user.firstName + ' ' + user.lastName,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`,
      lastMessage: 'Sin mensajes aún',
      time: 'Ahora',
      unread: 0,
      userId: user.id
    };

    this.conversations.unshift(conversation);
    localStorage.setItem('messages_' + conversationId, JSON.stringify([]));
    return conversation;
  }

  getMessages(conversationId: string): any[] {
    const key = 'messages_' + conversationId;
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    const conv = this.getConversation(conversationId);
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
    // Mensajes iniciales con el texto "Wow, that space is incredible..."
    const msgs = [
      {
        id: '1',
        text: '¡Hola! ¿Cómo estás?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        avatar: conv?.avatar || '',
        name: conv?.name || ''
      },
      {
        id: '2',
        text: 'Todo bien, ¿y tú?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        avatar: current?.avatar || '',
        name: current?.firstName + ' ' + current?.lastName || ''
      },
      {
        id: '3',
        text: 'Wow, that space is incredible. I\'ll be there by 7:15! See you soon.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        avatar: conv?.avatar || '',
        name: conv?.name || ''
      }
    ];
    localStorage.setItem(key, JSON.stringify(msgs));
    return msgs;
  }

  sendMessage(conversationId: string, message: any): void {
    const key = 'messages_' + conversationId;
    const stored = localStorage.getItem(key);
    const msgs = stored ? JSON.parse(stored) : [];
    msgs.push(message);
    localStorage.setItem(key, JSON.stringify(msgs));
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessage = message.text;
      conv.time = message.time;
    }
  }
}