import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputComponent } from '../../atoms/input/input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { ImageUploaderComponent } from '../../atoms/image-uploader/image-uploader.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'page-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputComponent, ButtonComponent, ImageUploaderComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  email: string = '';
  birthdate: string = '';
  password: string = '';
  confirmPassword: string = '';
  avatar: string = '';
  terms: boolean = false;
  error: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  onAvatarSelected(base64: string): void {
    this.avatar = base64;
  }

  onSubmit(): void {
    if (!this.firstName || !this.lastName || !this.username || !this.email || !this.birthdate || !this.password || !this.confirmPassword) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    if (!this.terms) {
      this.error = 'Debes aceptar los términos';
      return;
    }
    const success = this.auth.register({
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      email: this.email,
      birthdate: this.birthdate,
      password: this.password,
      avatar: this.avatar || `https://ui-avatars.com/api/?name=${this.firstName}+${this.lastName}&background=6366f1&color=fff`
    });
    if (success) {
      this.router.navigate(['/login']);
    } else {
      this.error = 'El usuario ya existe';
    }
  }
}