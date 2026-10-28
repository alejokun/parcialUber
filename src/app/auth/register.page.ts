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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { finalize } from 'rxjs';
import { AuthService, RegisterRequest } from '../core/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
  ],
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form: RegisterRequest = {
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client',
  };
  errorMessage = '';
  isLoading = false;

  submit(): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.auth.register({
      ...this.form,
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
    }).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => this.router.navigate(['/tabs/tab1']),
      error: (error: { error?: { message?: string }; status?: number }) => {
        this.errorMessage = error.error?.message
          ?? (error.status === 0
            ? 'No se pudo conectar con el servidor del profesor.'
            : 'No fue posible completar el registro. Revisa los datos.');
      },
    });
  }
}
