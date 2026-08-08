import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'page-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;

  constructor(private auth: AuthService, private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    if (!this.user) {
      this.user = {
        firstName: 'Invitado',
        lastName: 'Demo',
        username: 'guest',
        email: 'guest@demo.local',
        joined: 'Hoy',
        avatar: ''
      };
    }
  }

  deleteAccount(): void {
    if (!this.user?.id) return;
    if (confirm('¿Estás seguro de eliminar tu cuenta?')) {
      this.userService.deleteUser(this.user.id);
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    if (confirm('¿Cerrar sesión?')) {
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }
}