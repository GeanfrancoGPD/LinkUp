import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService, Conversation } from '../../../services/chat.service';

interface MensajeUI {
  id: string;
  text: string;
  image: string | null;
  time: string;
  isOwn: boolean;
  avatar: string;
  name: string;
}

@Component({
  selector: 'app-page-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class PageChatRoomComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('imageInput') private imageInput!: ElementRef<HTMLInputElement>;

  messages: MensajeUI[] = [];
  newMessage: string = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  idChat: number = 2;

  // Propiedad requerida por la plantilla HTML
  conversation: Conversation | null = null;

  private socketSub!: Subscription;

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
  ) {}

  // Getter para compatibilidad con la plantilla HTML
  get selectedImage(): string | null {
    return this.imagePreview;
  }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.idChat = Number(paramId);
    }

    this.chatService.unirseAChat(this.idChat);

    this.socketSub = this.chatService.newMessage$.subscribe(({ chatId, message }) => {
      if (String(chatId) === String(this.idChat)) {
        const exists = this.messages.some((m) => String(m.id) === String(message.id));
        if (!exists) {
          this.messages.push(message);
          this.cdRef.detectChanges();
          this.scrollToBottom();
        }
      }
    });

    this.cargarHistorial();
  }

  ngOnDestroy(): void {
    this.chatService.salirDeChat(this.idChat);
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() && !this.selectedFile) return;

    const textoEnviar = this.newMessage.trim();
    const fileToUpload = this.selectedFile;

    this.newMessage = '';
    this.clearSelectedImage();

    try {
      let rutaImagenServer: string | undefined = undefined;

      if (fileToUpload) {
        const uploadedPath = await this.chatService.subirImagen(fileToUpload).toPromise();
        if (uploadedPath) {
          rutaImagenServer = uploadedPath;
        } else {
          console.error('Error al subir imagen antes de emitir socket');
          return;
        }
      }

      const responseMsg = await this.chatService.enviarMensajeSocket(
        this.idChat,
        textoEnviar,
        rutaImagenServer,
      );

      const exists = this.messages.some((m) => String(m.id) === String(responseMsg.id));
      if (!exists) {
        this.messages.push(responseMsg);
        this.cdRef.detectChanges();
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  }

  openImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdRef.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  private cargarHistorial(): void {
    this.chatService.fetchMessages(this.idChat).subscribe((mensajes) => {
      this.messages = mensajes;
      this.cdRef.detectChanges();
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
