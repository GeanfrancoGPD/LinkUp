import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FriendService {
  private suggestions: any[] = [];
  private pendingRequests: any[] = [];
  private pendingRequestsLoaded = false;
  private readonly pendingRequestsStorageKey = 'pendingRequests';

  constructor(private http: HttpClient) {
    this.loadPendingRequestsFromStorage();
  }

  private loadPendingRequestsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.pendingRequestsStorageKey);
      if (stored) {
        this.pendingRequests = JSON.parse(stored);
        this.pendingRequestsLoaded = this.pendingRequests.length > 0;
      }
    } catch (error) {
      console.error('Error cargando solicitudes persistidas:', error);
    }
  }

  private savePendingRequestsToStorage(): void {
    localStorage.setItem(this.pendingRequestsStorageKey, JSON.stringify(this.pendingRequests));
  }

  private mapUserToSuggestion(user: any): any {
    const firstName = user.nombres || user.firstName || 'Usuario';
    const lastName = user.apellidos || user.lastName || '';

    return {
      id: String(user.id_usuario ?? user.id),
      firstName,
      lastName,
      avatar:
        user.foto_perfil ||
        user.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${firstName} ${lastName}`.trim(),
        )}&background=6366f1&color=fff`,
      bio: user.biografia || user.bio || 'Explorando nuevas conexiones',
      mutual: Math.floor(Math.random() * 15) + 1,
    };
  }

  private getFallbackSuggestions(): any[] {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const current = JSON.parse(localStorage.getItem('currentUser') || 'null');

    return users
      .filter((u: any) => u && u.id !== current?.id)
      .map((u: any) => this.mapUserToSuggestion(u));
  }

  fetchSuggestions(): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/sugerencias`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          this.suggestions = response.data.map((user) =>
            this.mapUserToSuggestion(user),
          );
          return this.suggestions;
        }),
        catchError((error) => {
          console.error('Error cargando sugerencias:', error);
          this.suggestions = this.getFallbackSuggestions();
          return of(this.suggestions);
        }),
      );
  }

  fetchPendingRequests(): Observable<any[]> {
    if (this.pendingRequestsLoaded) {
      return of(this.pendingRequests);
    }

    console.log('[FriendService] llamando /solicitudes/pendientes');
    return this.http
      .get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/solicitudes/pendientes`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          console.log('[FriendService] respuesta del backend', response);
          this.pendingRequests = (response.data || []).map((request: any) => ({
            idSolicitud: Number(request.id_solicitud),
            idUsuarioEnvia: Number(request.id_usuario_envia),
            idUsuarioRecibe: Number(request.id_usuario_recibe),
            name: request.nombre_usuario_envia || 'Usuario',
            avatar:
              request.foto_perfil ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                (request.nombre_usuario_envia || 'Usuario').trim(),
              )}&background=6366f1&color=fff`,
            bio: 'Quiere conectar contigo',
            mutual: Math.floor(Math.random() * 15) + 1,
          }));
          this.pendingRequestsLoaded = true;
          this.savePendingRequestsToStorage();
          return this.pendingRequests;
        }),
        catchError((error) => {
          console.error('[FriendService] Error cargando solicitudes pendientes:', error);
          return of(this.pendingRequests);
        }),
      );
  }

  acceptRequest(idSolicitud: number): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/solicitudes/aceptar`,
      { id_solicitud: idSolicitud },
      { withCredentials: true },
    ).pipe(
      map((response) => {
        this.pendingRequests = this.pendingRequests.filter((request) => request.idSolicitud !== idSolicitud);
        this.pendingRequestsLoaded = this.pendingRequests.length > 0;
        this.savePendingRequestsToStorage();
        return response;
      }),
    );
  }

  rejectRequest(idSolicitud: number): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/solicitudes/rechazar`,
      { id_solicitud: idSolicitud },
      { withCredentials: true },
    ).pipe(
      map((response) => {
        this.pendingRequests = this.pendingRequests.filter((request) => request.idSolicitud !== idSolicitud);
        this.pendingRequestsLoaded = this.pendingRequests.length > 0;
        this.savePendingRequestsToStorage();
        return response;
      }),
    );
  }

  refreshPendingRequests(): Observable<any[]> {
    return this.fetchPendingRequests().pipe(
      map((requests) => {
        this.pendingRequests = requests.filter((request) => request.idSolicitud);
        this.pendingRequestsLoaded = this.pendingRequests.length > 0;
        this.savePendingRequestsToStorage();
        return this.pendingRequests;
      }),
    );
  }

  getSuggestions(): any[] {
    return this.suggestions;
  }

  sendFriendRequest(id: string): Observable<any> {
    const id_usuario_recibe = Number(id);
    if (!Number.isFinite(id_usuario_recibe)) {
      return of(null);
    }

    return this.http.post(
      `${environment.apiUrl}/solicitudes`,
      { id_usuario_recibe },
      { withCredentials: true },
    );
  }

  acceptSuggestion(id: string): Observable<any> {
    return this.sendFriendRequest(id).pipe(
      map((response) => {
        this.suggestions = this.suggestions.filter((s) => s.id !== id);
        return response;
      }),
      catchError((err) => {
        console.error('Error enviando solicitud de amistad:', err);
        return of(null);
      }),
    );
  }

  rejectSuggestion(id: string): Observable<any> {
    this.suggestions = this.suggestions.filter((s) => s.id !== id);
    return of(null);
  }
}