import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Challenge } from '../../core/api/challenges-api.service';

@Component({
  selector: 'app-challenge-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './challenge-card.component.html',
  styleUrl: './challenge-card.component.css',
})
export class ChallengeCardComponent {
  @Input({ required: true }) challenge!: Challenge;

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
