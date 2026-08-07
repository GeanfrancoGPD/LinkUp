import { Injectable } from '@angular/core';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class FriendService {
  private suggestions: any[] = [];

  constructor(private chat: ChatService) {
    this.initSuggestions();
  }

  private initSuggestions(): void {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const mappedUsers = users
      .filter((u: any) => u && u.id !== current?.id)
      .map((u: any) => {
        const firstName = u.firstName || 'Usuario';
        const lastName = u.lastName || '';
        return {
          id: u.id,
          firstName,
          lastName,
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=6366f1&color=fff`,
          bio: u.bio || 'Explorando nuevas conexiones',
          mutual: Math.floor(Math.random() * 15) + 1
        };
      });

    this.suggestions = mappedUsers;
  }

  getSuggestions(userId: string): any[] {
    if (this.suggestions.length === 0) this.initSuggestions();
    return this.suggestions;
  }

  acceptSuggestion(id: string): void {
    const accepted = this.suggestions.find(s => s.id === id);
    if (accepted) {
      this.chat.createConversationFromSuggestion(accepted);
    }
    this.suggestions = this.suggestions.filter(s => s.id !== id);
  }

  rejectSuggestion(id: string): void {
    this.suggestions = this.suggestions.filter(s => s.id !== id);
  }
}