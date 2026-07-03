import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { errorMessage } from '../../core/api/api.constants';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  serverError = signal('');
  isSubmitting = signal(false);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  get redirectTo(): string {
    return (history.state as { from?: string })?.from || '/';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set('');
    this.isSubmitting.set(true);
    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.auth.login(res.token, { userId: res.userId, username: res.username });
        this.isSubmitting.set(false);
        this.router.navigateByUrl(this.redirectTo, { replaceUrl: true });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.serverError.set(errorMessage(err, 'Credenziali non valide'));
      },
    });
  }
}
