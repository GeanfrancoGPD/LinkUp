import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { BadgeComponent } from '../../atoms/badge/badge.component';

@Component({
  selector: 'molecule-conversation-item',
  standalone: true,
  imports: [CommonModule, AvatarComponent, BadgeComponent],
  templateUrl: './conversation-item.component.html',
  styleUrls: ['./conversation-item.component.scss']
})
export class ConversationItemComponent {
  @Input() name: string = '';
  @Input() lastMessage: string = '';
  @Input() time: string = '';
  @Input() unread: number = 0;
  @Input() avatar: string = '';
}