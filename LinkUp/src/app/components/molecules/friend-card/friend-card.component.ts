import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';

@Component({
  selector: 'molecule-friend-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './friend-card.component.html',
  styleUrls: ['./friend-card.component.scss']
})
export class FriendCardComponent {
  @Input() name: string = '';
  @Input() bio: string = '';
  @Input() mutual: number = 0;
  @Input() avatar: string = '';
  @Input() showActions: boolean = true;
  @Input() large: boolean = false;
  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();

  actionState: 'accept' | 'reject' | '' = '';

  handleAccept(): void {
    this.animateAction('accept');
  }

  handleReject(): void {
    this.animateAction('reject');
  }

  private animateAction(action: 'accept' | 'reject'): void {
    this.actionState = action;
    setTimeout(() => {
      this.actionState = '';
      if (action === 'accept') {
        this.accept.emit();
      } else {
        this.reject.emit();
      }
    }, 180);
  }
}