import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { ensureMockData } from '../data/mock-data';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    ensureMockData();
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      this.currentUser = parsed && (parsed.firstName || parsed.username) ? parsed : null;
    }

    if (!this.currentUser) {
      const users = this.getUsers();
      if (users.length) {
        this.currentUser = users[0];
        localStorage.setItem('currentUser', JSON.stringify(users[0]));
      }
    }
  }

  register(user: Partial<User>): boolean {
    const users = this.getUsers();
    if (users.find(u => u.email === user.email || u.username === user.username)) return false;
    const newUser: User = {
      id: Date.now().toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: user.email || '',
      birthdate: user.birthdate || '',
      password: user.password || '',
      avatar: user.avatar || '',
      bio: '',
      joined: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  }

  login(email: string, password: string): boolean {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  updateCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  private getUsers(): User[] {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  }
}