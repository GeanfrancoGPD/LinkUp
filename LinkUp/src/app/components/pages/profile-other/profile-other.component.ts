import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'page-profile-other',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './profile-other.component.html',
  styleUrls: ['./profile-other.component.scss']
})
export class ProfileOtherComponent implements OnInit {
  user: any = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/home']); return; }
    this.user = this.userService.getUserById(id);
    if (!this.user) { this.router.navigate(['/home']); return; }
  }

  sendMessage(): void {
    this.router.navigate(['/chat', 'conv-' + this.user.id]);
  }

  removeFriend(): void {
    if (confirm(`¿Eliminar a ${this.user.firstName} de tus amigos?`)) {
      alert('Amistad eliminada (simulado)');
    }
  }
}