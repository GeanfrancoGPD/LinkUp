import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  getUsers(): User[] {
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : [];
  }

  getUserById(id: string): User | null {
    return this.getUsers().find(u => u.id === id) || null;
  }

  updateUser(updated: User, newPassword?: string): void {
    // Call backend to update profile. The backend expects withCredentials cookie.
    const payload: any = { ...updated };
    if (newPassword) payload.newPassword = newPassword;

    this.http.put(`${environment.apiUrl}/profile`, payload, { withCredentials: true }).subscribe({
      next: () => {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === updated.id);
        if (idx !== -1) {
          users[idx] = updated;
          localStorage.setItem('users', JSON.stringify(users));
        }
      },
      error: (err) => console.error('Error updating user', err)
    });
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(users));
  }
}