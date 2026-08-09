import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export const EVENTOS = {
  UNIRSE_CHAT: 'chat:unirse',
  SALIR_CHAT: 'chat:salir',
  MENSAJE: 'chat:mensaje',
  NUEVO_MENSAJE: 'chat:nuevo_mensaje',
  ERROR: 'chat:error',
  TYPING: 'chat:typing',
  USUARIO_TYPING: 'chat:usuario_typing',
};

export interface Conversation {
  id: number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket!: Socket;
  private currentChatId: number | null = null;
  private messageStore: Record<string, any[]> = {};

  public newMessage$ = new Subject<{ chatId: string; message: any }>();

  constructor(private http: HttpClient) {
    this.initSocketConnection();
  }

  public initSocketConnection(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    const sid = localStorage.getItem('sid') || '';

    // Extrae únicamente el origen (ej: "http://localhost:3000") omitiendo rutas como /api, /v1, etc.
    let baseUrl: string;
    try {
      baseUrl = new URL(environment.apiUrl).origin;
    } catch (e) {
      baseUrl = 'http://localhost:3000';
    }

    console.log('[Socket] Conectando a origin:', baseUrl);

    this.socket = io(baseUrl, {
      auth: { sid },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      // Si tu servidor utiliza un path personalizado en Socket.IO, descómentalo e indícalo aquí:
      // path: '/socket.io/'
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Conectado exitosamente con ID:', this.socket.id);
      if (this.currentChatId) {
        this.unirseAChat(this.currentChatId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket Connect Error]:', err.message);
    });

    this.socket.on(EVENTOS.ERROR, (err: any) => {
      console.error('[Socket Error del Servidor]:', err);
    });

    this.socket.on(EVENTOS.NUEVO_MENSAJE, (rawMsg: any) => {
      const chatId = String(rawMsg.id_chat);
      const mappedMsg = this.mapBackendMessage(rawMsg);

      if (!this.messageStore[chatId]) {
        this.messageStore[chatId] = [];
      }

      const exists = this.messageStore[chatId].some((m) => String(m.id) === String(mappedMsg.id));
      if (!exists) {
        this.messageStore[chatId].push(mappedMsg);
      }

      this.newMessage$.next({ chatId, message: mappedMsg });
    });
  }

  unirseAChat(idChat: number): void {
    this.currentChatId = Number(idChat);
    if (this.socket?.connected && this.currentChatId) {
      console.log(`[Socket] Emitiendo UNIRSE_CHAT para id_chat: ${this.currentChatId}`);
      this.socket.emit(EVENTOS.UNIRSE_CHAT, { id_chat: this.currentChatId });
    }
  }

  salirDeChat(idChat: number): void {
    if (this.socket && idChat) {
      console.log(`[Socket] Emitiendo SALIR_CHAT para id_chat: ${idChat}`);
      this.socket.emit(EVENTOS.SALIR_CHAT, { id_chat: Number(idChat) });
      if (this.currentChatId === Number(idChat)) {
        this.currentChatId = null;
      }
    }
  }

  // Subida HTTP de imagen antes de emitir mensaje por Socket
  subirImagen(file: File): Observable<string | null> {
    const formData = new FormData();
    formData.append('imagen', file);

    return this.http
      .post<{ success: boolean; data: { ruta_imagen: string } }>(
        `${environment.apiUrl}/chats/upload-imagen`,
        formData,
        { withCredentials: true },
      )
      .pipe(
        map((res) => (res?.success ? res.data.ruta_imagen : null)),
        catchError((err) => {
          console.error('Error al subir imagen por HTTP:', err);
          return of(null);
        }),
      );
  }

  async enviarMensajeSocket(idChat: number, contenido: string, rutaImagen?: string): Promise<any> {
    // Si no está conectado, intenta reconectar antes de fallar
    if (!this.socket?.connected) {
      console.warn('[Socket] Desconectado. Intentando reconectar...');
      this.initSocketConnection();

      // Pequeña espera para permitir la reconexión (1 segundo max)
      await new Promise((r) => setTimeout(r, 1000));

      if (!this.socket?.connected) {
        throw new Error('No se pudo establecer conexión con el servidor de chat.');
      }
    }

    return new Promise((resolve, reject) => {
      const payload = {
        id_chat: Number(idChat),
        contenido: contenido.trim(),
        tipo: rutaImagen ? 'Imagen' : 'Texto',
        ...(rutaImagen && { ruta_imagen: rutaImagen }),
      };

      const timer = setTimeout(() => {
        reject('Tiempo de espera agotado para el ACK del servidor');
      }, 5000);

      this.socket.emit(EVENTOS.MENSAJE, payload, (ackResponse: any) => {
        clearTimeout(timer);

        if (ackResponse?.success) {
          const mapped = this.mapBackendMessage(ackResponse.data);
          const chatIdKey = String(idChat);
          if (!this.messageStore[chatIdKey]) this.messageStore[chatIdKey] = [];

          const exists = this.messageStore[chatIdKey].some(
            (m) => String(m.id) === String(mapped.id),
          );
          if (!exists) {
            this.messageStore[chatIdKey].push(mapped);
          }

          resolve(mapped);
        } else {
          reject(ackResponse?.message || 'Error al procesar mensaje en backend');
        }
      });
    });
  }

  fetchMessages(chatId: string | number, limit = 50, beforeId?: number): Observable<any[]> {
    let params = new HttpParams().set('limit', limit);
    if (beforeId) params = params.set('before_id', beforeId);

    return this.http
      .get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/chats/${chatId}/mensajes`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          if (res?.success && Array.isArray(res.data)) {
            const mapped = res.data.map((m) => this.mapBackendMessage(m));
            this.messageStore[String(chatId)] = mapped;
            return mapped;
          }
          return [];
        }),
        catchError((err) => {
          console.error(`Error obteniendo historial de chat ${chatId}:`, err);
          return of([]);
        }),
      );
  }

  fetchConversations(): Observable<Conversation[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/chats`, {
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          if (res?.success && Array.isArray(res.data)) {
            return res.data.map((c) => ({
              id: c.id_chat,
              name: c.nombre || c.usuario || 'Chat',
              avatar: c.foto_perfil || 'assets/images/default-avatar.png',
              lastMessage: c.ultimo_mensaje || '',
              unreadCount: c.mensajes_no_leidos || 0,
            }));
          }
          return [];
        }),
        catchError((err) => {
          console.error('Error al obtener conversaciones:', err);
          return of([]);
        }),
      );
  }

  public mapBackendMessage(msg: any): any {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
    const isOwn = currentUserId !== null && Number(msg.id_usuario) === currentUserId;
    // Fallback limpio SVG inline en caso de que no exista el archivo físico
    const DEFAULT_AVATAR =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-1.04-4.84-2.61.03-1.6 3.23-2.48 4.84-2.48 1.6 0 4.81.88 4.84 2.48C15.8 18.96 14.03 20 12 20z"/></svg>';

    return {
      id: String(msg.id_mensaje || Date.now()),
      text: msg.contenido || '',
      image: msg.ruta_imagen ? `${environment.apiUrl.replace('/api', '')}${msg.ruta_imagen}` : null,
      time: msg.fecha_envio
        ? new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn,
      avatar: msg.foto_perfil || DEFAULT_AVATAR,
      name: msg.usuario || 'Usuario',
    };
  }
}
