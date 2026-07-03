import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth-api.service';
import { errorMessage } from '../../core/api/api.constants';
import { AuthService } from '../../core/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  serverError = signal('');
  isSubmitting = signal(false);

  form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator() }
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set('');
    this.isSubmitting.set(true);
    const { username, email, password } = this.form.getRawValue();
    this.authApi.register({ username, email, password }).subscribe({
      next: (res) => {
        this.auth.login(res.token, { userId: res.userId, username: res.username });
        this.isSubmitting.set(false);
        this.router.navigate(['/'], { replaceUrl: true });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.serverError.set(errorMessage(err, 'Registrazione non riuscita'));
      },
    });
  }
}
