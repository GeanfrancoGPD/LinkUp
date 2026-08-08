import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FriendCardComponent } from '../../molecules/friend-card/friend-card.component';
import { FriendService } from '../../../services/friend.service';

@Component({
  selector: 'page-swipe',
  standalone: true,
  imports: [CommonModule, RouterLink, FriendCardComponent],
  templateUrl: './swipe.component.html',
  styleUrls: ['./swipe.component.scss']
})
export class SwipeComponent implements OnInit {
  requests: any[] = [];
  empty = false;

  constructor(private friend: FriendService) {}

  ngOnInit(): void {
    console.log('[Solicitudes] componente inicializado');
    this.refreshRequests();
  }

  accept(idSolicitud: number): void {
    this.friend.acceptRequest(idSolicitud).subscribe(() => {
      this.refreshRequests();
    });
  }

  reject(idSolicitud: number): void {
    this.friend.rejectRequest(idSolicitud).subscribe(() => {
      this.refreshRequests();
    });
  }

  private refreshRequests(): void {
    console.log('[Solicitudes] solicitando solicitudes pendientes');
    this.friend.refreshPendingRequests().subscribe((requests) => {
      console.log('[Solicitudes] respuesta recibida', requests);
      this.requests = requests;
      this.empty = this.requests.length === 0;
      console.log('[Solicitudes] estado final', { count: this.requests.length, empty: this.empty });
    });
  }
}