import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputComponent } from '../../atoms/input/input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ImageUploaderComponent } from '../../atoms/image-uploader/image-uploader.component';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'page-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputComponent, ButtonComponent, ImageUploaderComponent],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss']
})
export class ProfileEditComponent implements OnInit {
  user: any = null;
  name: string = '';
  username: string = '';
  email: string = '';
  bio: string = '';
  avatar: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private auth: AuthService, private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    if (this.user) {
      this.name = this.user.firstName + ' ' + this.user.lastName;
      this.username = this.user.username;
      this.email = this.user.email;
      this.bio = this.user.bio || '';
      this.avatar = this.user.avatar;
    }
  }

  onAvatarSelected(base64: string): void {
    this.avatar = base64;
  }

  onSubmit(): void {
    if (!this.user) return;
    const parts = this.name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const updated = { ...this.user, firstName, lastName, username: this.username, email: this.email, bio: this.bio, avatar: this.avatar };
    this.userService.updateUser(updated, this.newPassword || undefined);
    this.auth.updateCurrentUser(updated);
    this.router.navigate(['/profile']);
  }

  deleteAccount(): void {
    if (!this.user?.id) return;
    if (confirm('¿Eliminar cuenta?')) {
      this.userService.deleteUser(this.user.id);
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }
}