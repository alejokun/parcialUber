import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  login = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  submit(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.auth.login({ login: this.login.trim(), password: this.password })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => this.router.navigate(['/tabs/tab1']),
        error: (error: { error?: { message?: string }; status?: number }) => {
          this.errorMessage = error.error?.message
            ?? (error.status === 0
              ? 'No se pudo conectar con el servidor del profesor.'
              : 'No fue posible iniciar sesión. Revisa tus datos.');
        },
      });
  }
}
