import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';

import { ChatSocketService, Mensaje, TypingEvent } from '../../services/chat-socket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly mensajes: Mensaje[] = [];

  typingUser: string | null = null;

  private typingTimeout?: ReturnType<typeof setTimeout>;

  readonly chatId = 15;

  constructor(private readonly chatSocket: ChatSocketService) {}

  ngOnInit(): void {
    /**
     * En una aplicación real el sid debería venir
     * de tu servicio de autenticación.
     */
    const sessionId = 'SESSION_ID';

    this.chatSocket.connect(sessionId);

    /**
     * Estado de conexión.
     */
    this.chatSocket.connected$.pipe(takeUntil(this.destroy$)).subscribe((connected) => {
      console.log('Socket conectado:', connected);
    });

    /**
     * Mensajes nuevos.
     */
    this.chatSocket.mensajes$.pipe(takeUntil(this.destroy$)).subscribe((mensaje) => {
      /**
       * Evitamos duplicados.
       */
      const exists = this.mensajes.some((m) => m.id_mensaje === mensaje.id_mensaje);

      if (!exists) {
        this.mensajes.push(mensaje);
      }
    });

    /**
     * Usuario escribiendo.
     */
    this.chatSocket.typing$.pipe(takeUntil(this.destroy$)).subscribe((data: TypingEvent) => {
      /**
       * No mostramos nuestro propio typing.
       *
       * Lo ideal es comparar contra el usuario
       * autenticado del frontend.
       */
      if (data.escribiendo) {
        this.typingUser = data.nombre_usuario;

        this.resetTypingTimeout();
      } else {
        this.typingUser = null;
      }
    });

    /**
     * Errores.
     */
    this.chatSocket.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
      console.error('Error Socket:', error.message);
    });

    /**
     * Entrar al chat.
     */
    this.chatSocket.joinChat(this.chatId);
  }

  /**
   * Enviar mensaje de texto.
   */
  enviarMensaje(contenido: string): void {
    if (!contenido.trim()) {
      return;
    }

    this.chatSocket
      .sendMessage({
        id_chat: this.chatId,
        contenido: contenido.trim(),
        tipo: 'Texto',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (!response.success) {
          console.error('No se pudo enviar:', response.message);

          return;
        }

        console.log('Mensaje enviado:', response.data);
      });
  }

  /**
   * Usuario empieza a escribir.
   */
  onTyping(): void {
    this.chatSocket.setTyping(this.chatId, true);

    this.resetTypingTimeout();
  }

  /**
   * Detiene el typing después de un tiempo
   * sin pulsaciones.
   */
  private resetTypingTimeout(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.chatSocket.setTyping(this.chatId, false);
    }, 1500);
  }

  /**
   * Cambiar de chat.
   */
  cambiarChat(nuevoChatId: number): void {
    this.chatSocket.leaveChat(this.chatSocket.getActiveChatId() ?? undefined);

    this.mensajes.length = 0;

    this.chatSocket.joinChat(nuevoChatId);
  }

  ngOnDestroy(): void {
    /**
     * Detener typing.
     */
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    /**
     * Salir de la room.
     */
    this.chatSocket.leaveChat(this.chatSocket.getActiveChatId() ?? undefined);

    /**
     * Cancelar subscriptions del componente.
     */
    this.destroy$.next();
    this.destroy$.complete();

    /**
     * IMPORTANTE:
     *
     * No hacemos disconnect() aquí si el servicio
     * debe permanecer conectado mientras la aplicación
     * esté abierta.
     */
  }
}
