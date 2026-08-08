import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatMessageComponent } from '../../molecules/chat-message/chat-message.component';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'page-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatMessageComponent],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  private readonly chat = inject(ChatService);

  conversationId: string = '';
  messages: any[] = [];
  newMessage: string = '';
  selectedImage: string | null = null;
  currentUser: any = null;
  conversation: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    if (!this.currentUser) {
      this.currentUser = {
        firstName: 'Invitado',
        lastName: 'Demo',
        avatar: ''
      };
    }
    this.conversationId = this.route.snapshot.paramMap.get('id') || '';
    this.conversation = this.chat.getConversation(this.conversationId);
    if (!this.conversation) this.router.navigate(['/chats']);
    this.messages = this.chat.getMessages(this.conversationId);
    this.scrollToBottom();
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    if (!text && !this.selectedImage) return;

    const msg = {
      id: Date.now().toString(),
      text,
      image: this.selectedImage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      avatar: this.currentUser.avatar,
      name: this.currentUser.firstName + ' ' + this.currentUser.lastName
    };
    this.chat.sendMessage(this.conversationId, msg);
    this.messages = this.chat.getMessages(this.conversationId);
    this.newMessage = '';
    this.clearSelectedImage();
    this.scrollToBottom();
  }

  openImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage(): void {
    this.selectedImage = null;
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}