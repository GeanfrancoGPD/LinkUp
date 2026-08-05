import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'atom-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="atom-badge" *ngIf="count > 0">{{ count > 99 ? '99+' : count }}</span>`,
  styleUrls: ['./badge.component.scss']
})
export class BadgeComponent {
  @Input() count: number = 0;
}