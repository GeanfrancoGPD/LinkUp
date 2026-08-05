import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { FriendCardComponent } from '../../molecules/friend-card/friend-card.component';
import { AuthService } from '../../../services/auth.service';
import { FriendService } from '../../../services/friend.service';

@Component({
  selector: 'page-home',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, FriendCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: any = null;
  suggestions: any[] = [];
  currentIndex = 0;
  empty = false;

  constructor(private auth: AuthService, private friend: FriendService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.refreshSuggestions();
  }

  get current(): any {
    return this.suggestions[this.currentIndex] || null;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  accept(): void {
    if (!this.current) return;
    this.friend.acceptSuggestion(this.current.id);
    this.next();
  }

  reject(): void {
    if (!this.current) return;
    this.friend.rejectSuggestion(this.current.id);
    this.next();
  }

  private next(): void {
    this.currentIndex += 1;
    if (this.currentIndex >= this.suggestions.length) {
      this.refreshSuggestions();
      this.currentIndex = 0;
    }
    this.empty = this.suggestions.length === 0;
  }

  private refreshSuggestions(): void {
    this.suggestions = this.friend.getSuggestions(this.currentUser?.id || 'guest');
    this.currentIndex = 0;
    this.empty = this.suggestions.length === 0;
  }
}