import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';

/**
 * ============================================================
 * MODELOS
 * ============================================================
 */

export type TipoMensaje = 'Texto' | 'Imagen';

export interface SocketUser {
  id: number;
  nombre: string;
}

export interface Mensaje {
  id_mensaje: number;
  id_chat: number;
  id_usuario: number;
  usuario: string;
  contenido: string;
  tipo: TipoMensaje;
  ruta_imagen?: string;
  fecha_envio: string | Date;
}

export interface EnviarMensajeDTO {
  id_chat: number;
  contenido: string;
  tipo?: TipoMensaje;
  ruta_imagen?: string;
  nombre_archivo?: string;
  tamano_kb?: number;
}

export interface TypingEvent {
  id_chat: number;
  id_usuario: number;
  nombre_usuario: string;
  escribiendo: boolean;
}

export interface UsuarioChatEvent {
  id_chat: number;
  id_usuario: number;
  nombre_usuario: string;
}

export interface SocketError {
  success: false;
  message: string;
}

export interface EnviarMensajeResponse {
  success: boolean;
  data?: Mensaje;
  message?: string;
}

/**
 * ============================================================
 * EVENTOS
 * ============================================================
 *
 * Estos nombres corresponden a los eventos utilizados
 * actualmente por el backend.
 *
 * Si el frontend comparte el enum EVENTOS, es mejor importarlo
 * y utilizarlo directamente.
 */

const SOCKET_EVENTS = {
  UNIRSE_CHAT: 'UNIRSE_CHAT',
  SALIR_CHAT: 'SALIR_CHAT',
  MENSAJE: 'MENSAJE',
  TYPING: 'TYPING',

  USUARIO_UNIDO: 'USUARIO_UNIDO',
  USUARIO_SALIO: 'USUARIO_SALIO',
  NUEVO_MENSAJE: 'NUEVO_MENSAJE',
  USUARIO_TYPING: 'USUARIO_TYPING',

  ERROR: 'ERROR',
} as const;

/**
 * ============================================================
 * CONFIGURACIÓN
 * ============================================================
 */

const SOCKET_URL = 'http://localhost:5000';

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService implements OnDestroy {
  private socket: Socket | null = null;

  /**
   * Chat actualmente activo.
   *
   * Solo se mantiene un chat activo por instancia del servicio.
   */
  private activeChatId: number | null = null;

  /**
   * Estado de conexión.
   */
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);

  readonly connected$ = this.connectedSubject
    .asObservable()
    .pipe(distinctUntilChanged(), shareReplay({ bufferSize: 1, refCount: true }));

  /**
   * Mensajes recibidos.
   */
  private readonly mensajeSubject = new Subject<Mensaje>();

  readonly mensajes$: Observable<Mensaje> = this.mensajeSubject.asObservable();

  /**
   * Usuario que entra al chat.
   */
  private readonly usuarioUnidoSubject = new Subject<UsuarioChatEvent>();

  readonly usuarioUnido$: Observable<UsuarioChatEvent> = this.usuarioUnidoSubject.asObservable();

  /**
   * Usuario que sale del chat.
   */
  private readonly usuarioSalioSubject = new Subject<UsuarioChatEvent>();

  readonly usuarioSalio$: Observable<UsuarioChatEvent> = this.usuarioSalioSubject.asObservable();

  /**
   * Eventos de typing.
   */
  private readonly typingSubject = new Subject<TypingEvent>();

  readonly typing$: Observable<TypingEvent> = this.typingSubject.asObservable();

  /**
   * Errores enviados por el backend.
   */
  private readonly errorSubject = new Subject<SocketError>();

  readonly error$: Observable<SocketError> = this.errorSubject.asObservable();

  /**
   * Permite saber qué chat está actualmente activo.
   */
  private readonly activeChatSubject = new BehaviorSubject<number | null>(null);

  readonly activeChat$ = this.activeChatSubject.asObservable();

  /**
   * ==========================================================
   * CONEXIÓN
   * ==========================================================
   */

  connect(sessionId: string): void {
    if (!sessionId) {
      console.error('[ChatSocket] No se proporcionó sessionId');
      return;
    }

    /**
     * Si ya existe un socket conectado o conectándose,
     * no creamos otra conexión.
     */
    if (this.socket) {
      if (this.socket.connected) {
        return;
      }

      this.socket.connect();
      return;
    }

    this.socket = io(SOCKET_URL, {
      /**
       * El backend espera:
       *
       * socket.handshake.auth.sid
       */
      auth: {
        sid: sessionId,
      },

      /**
       * El backend tiene credentials: true.
       */
      withCredentials: true,

      /**
       * Socket.IO gestionará automáticamente
       * la reconexión.
       */
      reconnection: true,

      /**
       * Intentos ilimitados.
       */
      reconnectionAttempts: Infinity,

      /**
       * Tiempo inicial entre reconexiones.
       */
      reconnectionDelay: 1000,

      /**
       * Máximo delay.
       */
      reconnectionDelayMax: 5000,

      /**
       * Factor de randomización.
       */
      randomizationFactor: 0.5,
    });

    this.registerSocketListeners();
  }

  /**
   * ==========================================================
   * LISTENERS INTERNOS
   * ==========================================================
   */

  private registerSocketListeners(): void {
    if (!this.socket) {
      return;
    }

    /**
     * Conexión establecida.
     */
    this.socket.on('connect', () => {
      console.log('[ChatSocket] Conectado:', this.socket?.id);

      this.connectedSubject.next(true);

      /**
       * Si había un chat activo antes de una reconexión,
       * volvemos a entrar en la room.
       */
      if (this.activeChatId !== null) {
        this.joinChat(this.activeChatId);
      }
    });

    /**
     * Desconexión.
     */
    this.socket.on('disconnect', (reason) => {
      console.log('[ChatSocket] Desconectado:', reason);

      this.connectedSubject.next(false);
    });

    /**
     * Error durante el handshake.
     *
     * Ejemplo del backend:
     *
     * UNAUTHORIZED: session ID requerido
     * UNAUTHORIZED: sesion invalida
     */
    this.socket.on('connect_error', (error) => {
      console.error('[ChatSocket] Error de conexión:', error.message);

      this.connectedSubject.next(false);

      this.errorSubject.next({
        success: false,
        message: error.message,
      });
    });

    /**
     * Error emitido por el backend.
     */
    this.socket.on(SOCKET_EVENTS.ERROR, (error: SocketError) => {
      console.error('[ChatSocket] Error backend:', error);

      this.errorSubject.next(error);
    });

    /**
     * Nuevo mensaje.
     */
    this.socket.on(SOCKET_EVENTS.NUEVO_MENSAJE, (mensaje: Mensaje) => {
      this.mensajeSubject.next(mensaje);
    });

    /**
     * Usuario unido.
     */
    this.socket.on(SOCKET_EVENTS.USUARIO_UNIDO, (data: UsuarioChatEvent) => {
      this.usuarioUnidoSubject.next(data);
    });

    /**
     * Usuario salió.
     */
    this.socket.on(SOCKET_EVENTS.USUARIO_SALIO, (data: UsuarioChatEvent) => {
      this.usuarioSalioSubject.next(data);
    });

    /**
     * Usuario escribiendo.
     */
    this.socket.on(SOCKET_EVENTS.USUARIO_TYPING, (data: TypingEvent) => {
      this.typingSubject.next(data);
    });
  }

  /**
   * ==========================================================
   * ROOM: ENTRAR
   * ==========================================================
   */

  joinChat(idChat: number): void {
    if (!this.socket) {
      console.warn('[ChatSocket] Socket no inicializado');
      return;
    }

    if (!this.socket.connected) {
      console.warn('[ChatSocket] Socket no conectado');
      return;
    }

    /**
     * Si estamos en otro chat, salimos primero.
     */
    if (this.activeChatId !== null && this.activeChatId !== idChat) {
      this.leaveChat(this.activeChatId);
    }

    this.activeChatId = idChat;
    this.activeChatSubject.next(idChat);

    this.socket.emit(SOCKET_EVENTS.UNIRSE_CHAT, {
      id_chat: idChat,
    });
  }

  /**
   * ==========================================================
   * ROOM: SALIR
   * ==========================================================
   */

  leaveChat(idChat?: number): void {
    if (!this.socket) {
      return;
    }

    const chatId = idChat ?? this.activeChatId;

    if (!chatId) {
      return;
    }

    if (this.socket.connected) {
      this.socket.emit(SOCKET_EVENTS.SALIR_CHAT, {
        id_chat: chatId,
      });
    }

    if (this.activeChatId === chatId) {
      this.activeChatId = null;
      this.activeChatSubject.next(null);
    }
  }

  /**
   * ==========================================================
   * MENSAJES
   * ==========================================================
   */

  sendMessage(data: EnviarMensajeDTO): Observable<EnviarMensajeResponse> {
    return new Observable((subscriber) => {
      if (!this.socket) {
        subscriber.next({
          success: false,
          message: 'Socket no inicializado',
        });

        subscriber.complete();
        return;
      }

      if (!this.socket.connected) {
        subscriber.next({
          success: false,
          message: 'Socket no conectado',
        });

        subscriber.complete();
        return;
      }

      this.socket.emit(SOCKET_EVENTS.MENSAJE, data, (response: EnviarMensajeResponse) => {
        subscriber.next(response);
        subscriber.complete();
      });
    });
  }

  /**
   * ==========================================================
   * TYPING
   * ==========================================================
   */

  setTyping(idChat: number, escribiendo: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(SOCKET_EVENTS.TYPING, {
      id_chat: idChat,
      escribiendo,
    });
  }

  /**
   * ==========================================================
   * DESCONEXIÓN
   * ==========================================================
   */

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    /**
     * Salimos de la room actual antes de desconectar.
     */
    if (this.activeChatId !== null) {
      this.leaveChat(this.activeChatId);
    }

    /**
     * Eliminamos todos los listeners registrados
     * por este servicio.
     */
    this.socket.removeAllListeners();

    /**
     * Cerramos conexión.
     */
    this.socket.disconnect();

    this.socket = null;

    this.connectedSubject.next(false);

    this.activeChatId = null;
    this.activeChatSubject.next(null);
  }

  /**
   * ==========================================================
   * UTILIDADES
   * ==========================================================
   */

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getActiveChatId(): number | null {
    return this.activeChatId;
  }

  /**
   * ==========================================================
   * CLEANUP
   * ==========================================================
   */

  ngOnDestroy(): void {
    this.disconnect();

    this.connectedSubject.complete();
    this.activeChatSubject.complete();

    this.mensajeSubject.complete();
    this.usuarioUnidoSubject.complete();
    this.usuarioSalioSubject.complete();
    this.typingSubject.complete();
    this.errorSubject.complete();
  }
}
