import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

interface LoginApiResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    email: string;
    nombre?: string;
    tipo?: string;
  };
}

interface RegisterApiResponse {
  success: boolean;
  message?: string;
  id_usuario?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: User | null = null;

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      this.currentUser = parsed && (parsed.firstName || parsed.username) ? parsed : null;
    }
  }

  register(user: Partial<User>): Observable<boolean> {
    const payload = {
      nombres: user.firstName || '',
      apellidos: user.lastName || '',
      nombre_usuario: user.username || '',
      correo: user.email || '',
      contrasena: user.password || '',
      telefono: null,
      fecha_nacimiento: user.birthdate || '',
      sexo: 'Otro',
      biografia: '',
      foto_perfil: user.avatar || ''
    };

    return this.http.post<RegisterApiResponse>(`${environment.apiUrl}/register`, payload, { withCredentials: true }).pipe(
      map((response) => response?.success === true),
      catchError((error) => {
        const backendMessage = error?.error?.message || 'No se pudo registrar el usuario';
        return throwError(() => backendMessage);
      })
    );
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<LoginApiResponse>(`${environment.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      map((response) => {
        if (response?.success && response.user) {
          const mappedUser: User = {
            id: String(response.user.id),
            firstName: response.user.nombre || '',
            lastName: '',
            username: response.user.email.split('@')[0] || '',
            email: response.user.email,
            birthdate: '',
            password: '',
            avatar: '',
            bio: '',
            joined: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
          };

          this.currentUser = mappedUser;
          localStorage.setItem('currentUser', JSON.stringify(mappedUser));
          return true;
        }

        return false;
      }),
      catchError((error) => {
        const backendMessage = error?.error?.message || 'Credenciales inválidas';
        return throwError(() => backendMessage);
      })
    );
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