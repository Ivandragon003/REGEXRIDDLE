import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Challenge, ChallengesApiService } from '../../core/api/challenges-api.service';
import { errorMessage } from '../../core/api/api.constants';
import { UserApiService, UserProfile } from '../../core/api/user-api.service';
import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

interface Feedback {
  type: 'success' | 'error';
  text: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private userApi = inject(UserApiService);
  private challengesApi = inject(ChallengesApiService);
  auth = inject(AuthService);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  profile = signal<UserProfile | null>(null);
  myChallenges = signal<Challenge[] | null>(null);
  isLoading = signal(true);

  username = signal('');
  email = signal('');
  feedback = signal<Feedback | null>(null);
  saving = signal(false);
  uploading = signal(false);

  constructor() {
    this.userApi.getMe().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.username.set(profile.username);
        this.email.set(profile.email);
        this.isLoading.set(false);
      },
    });
    this.challengesApi.getMy().subscribe({
      next: (data) => this.myChallenges.set(data),
    });
  }

  triggerFileInput(): void {
    this.fileInput()?.nativeElement.click();
  }

  handleSave(): void {
    this.feedback.set(null);
    this.saving.set(true);
    this.userApi.updateMe({ username: this.username(), email: this.email() }).subscribe({
      next: (updated) => {
        this.auth.updateUser({ username: updated.username });
        this.profile.set(updated);
        this.saving.set(false);
        this.feedback.set({ type: 'success', text: 'Profilo aggiornato con successo.' });
      },
      error: (err) => {
        this.saving.set(false);
        this.feedback.set({ type: 'error', text: errorMessage(err, 'Aggiornamento non riuscito') });
      },
    });
  }

  handleAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.feedback.set(null);
    this.uploading.set(true);
    this.userApi.uploadAvatar(file).subscribe({
      next: (res) => {
        this.auth.updateUser({ avatarUrl: res.avatarUrl });
        this.profile.update((p) => (p ? { ...p, avatarUrl: res.avatarUrl } : p));
        this.uploading.set(false);
        this.feedback.set({ type: 'success', text: 'Avatar aggiornato.' });
      },
      error: (err) => {
        this.uploading.set(false);
        this.feedback.set({ type: 'error', text: errorMessage(err, 'Upload non riuscito') });
      },
    });
  }
}
