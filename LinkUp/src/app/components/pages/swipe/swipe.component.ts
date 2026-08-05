import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FriendCardComponent } from '../../molecules/friend-card/friend-card.component';
import { AuthService } from '../../../services/auth.service';
import { FriendService } from '../../../services/friend.service';

@Component({
  selector: 'page-swipe',
  standalone: true,
  imports: [CommonModule, RouterLink, FriendCardComponent],
  templateUrl: './swipe.component.html',
  styleUrls: ['./swipe.component.scss']
})
export class SwipeComponent implements OnInit {
  suggestions: any[] = [];
  empty: boolean = false;

  constructor(private auth: AuthService, private friend: FriendService, private router: Router) {}

  ngOnInit(): void {
    this.refreshSuggestions();
  }

  accept(id: string): void {
    this.friend.acceptSuggestion(id);
    this.refreshSuggestions();
  }

  reject(id: string): void {
    this.friend.rejectSuggestion(id);
    this.refreshSuggestions();
  }

  private refreshSuggestions(): void {
    const userId = this.auth.getCurrentUser()?.id || 'guest';
    this.suggestions = this.friend.getSuggestions(userId);
    this.empty = this.suggestions.length === 0;
  }
}