import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  currentUser: any = null;
  suggestions: any[] = [];
  currentIndex = 0;
  empty = false;

  constructor(
    private auth: AuthService,
    private friend: FriendService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.refreshSuggestions();
  }

  get current(): any {
    if (!this.suggestions || this.suggestions.length === 0) return null;
    return this.suggestions[this.currentIndex] || null;
  }

  get currentFullName(): string {
    if (!this.current) return '';
    const first = this.current.firstName || '';
    const last = this.current.lastName || '';
    return `${first}${last}`.trim();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  accept(): void {
    if (!this.current) return;
    this.friend.acceptSuggestion(this.current.id).subscribe(() => {
      this.next();
    });
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
    } else {
      this.cdr.detectChanges();
    }
  }

  private refreshSuggestions(): void {
    this.friend.fetchSuggestions().subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions || [];
        this.currentIndex = 0;
        this.empty = this.suggestions.length === 0;
        this.cdr.detectChanges(); // Forzar el renderizado inmediato en pantalla
      },
      error: (err) => {
        console.error('Error cargando sugerencias:', err);
        this.empty = true;
        this.cdr.detectChanges();
      },
    });
  }
}
