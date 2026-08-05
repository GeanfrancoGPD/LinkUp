import { Component, OnInit, inject } from '@angular/core';
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

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.conversations = this.chat.getConversations(user?.id || 'guest');
  }

  openChat(id: string): void {
    this.router.navigate(['/chat', id]);
  }
}