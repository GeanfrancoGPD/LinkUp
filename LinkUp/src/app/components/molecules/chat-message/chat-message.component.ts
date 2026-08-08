import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';

@Component({
  selector: 'molecule-chat-message',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent {
  @Input() text: string = '';
  @Input() image: string | null = null;
  @Input() time: string = '';
  @Input() isOwn: boolean = false;
  @Input() avatar: string = '';
  @Input() name: string = '';
}