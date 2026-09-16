import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
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
  imports: [CommonModule, RouterLink, AvatarComponent],
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

  feedback = signal<Feedback | null>(null);
  uploading = signal(false);

  constructor() {
    this.userApi.getMe().subscribe({
      next: (profile) => {
        this.profile.set(profile);
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
