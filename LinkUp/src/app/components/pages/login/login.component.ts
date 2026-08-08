import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputComponent } from '../../atoms/input/input.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'page-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InputComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  remember: boolean = false;
  error: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }

    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (ok) => {
        if (ok) {
          this.router.navigate(['/home']);
        } else {
          this.error = 'Credenciales inválidas';
        }
      },
      error: (message) => {
        this.error = typeof message === 'string' ? message : 'Credenciales inválidas';
      }
    });
  }
}