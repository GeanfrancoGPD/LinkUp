import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ConversationItemComponent } from '../../molecules/conversation-item/conversation-item.component';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'page-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConversationItemComponent],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit {
  conversations: any[] = [];
  private readonly chat = inject(ChatService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Cargando chats desde el backend...');
    this.chat.fetchConversations().subscribe((conversations) => {
      console.log('Chats recibidos desde el backend:', conversations);
      this.conversations = Array.isArray(conversations) ? [...conversations] : [];
      console.log('Chats mapeados para la UI:', this.conversations);
      console.log('Longitud final:', this.conversations.length);
      this.cdr.detectChanges();
    });
  }

  openChat(id: string): void {
    this.router.navigate(['/chat', id]);
  }
}