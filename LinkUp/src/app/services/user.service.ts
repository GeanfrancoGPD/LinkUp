import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  getUsers(): User[] {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  }

  getUserById(id: string): User | null {
    return this.getUsers().find(u => u.id === id) || null;
  }

  updateUser(updated: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === updated.id);
    if (idx !== -1) {
      users[idx] = updated;
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(users));
  }
}