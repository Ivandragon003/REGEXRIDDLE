import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChallengesApiService } from '../../core/api/challenges-api.service';
import { errorMessage } from '../../core/api/api.constants';

const MAX_CONTROL = 10;

function compileRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

interface FormErrors {
  title?: string;
  secretRegex?: string;
  exampleMatch?: string;
  exampleNoMatch?: string;
  positives?: string;
  negatives?: string;
}

@Component({
  selector: 'app-create-challenge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-challenge.component.html',
  styleUrl: './create-challenge.component.css',
})
export class CreateChallengeComponent {
  private router = inject(Router);
  private challengesApi = inject(ChallengesApiService);

  maxControl = MAX_CONTROL;

  title = signal('');
  description = signal('');
  secretRegex = signal('');
  exampleMatch = signal('');
  exampleNoMatch = signal('');
  positives = signal<string[]>(['']);
  negatives = signal<string[]>(['']);
  errors = signal<FormErrors>({});
  isPending = signal(false);
  createError = signal('');

  get re(): RegExp | null {
    return compileRegex(this.secretRegex());
  }

  get regexValid(): boolean {
    return this.secretRegex() !== '' && this.re !== null;
  }

  addPositive(): void {
    if (this.positives().length < MAX_CONTROL) this.positives.update((v) => [...v, '']);
  }
  removePositive(i: number): void {
    this.positives.update((v) => v.filter((_, idx) => idx !== i));
  }
  updatePositive(i: number, value: string): void {
    this.positives.update((v) => v.map((item, idx) => (idx === i ? value : item)));
  }

  addNegative(): void {
    if (this.negatives().length < MAX_CONTROL) this.negatives.update((v) => [...v, '']);
  }
  removeNegative(i: number): void {
    this.negatives.update((v) => v.filter((_, idx) => idx !== i));
  }
  updateNegative(i: number, value: string): void {
    this.negatives.update((v) => v.map((item, idx) => (idx === i ? value : item)));
  }

  controlStatus(value: string, shouldMatch: boolean): boolean | null {
    if (!this.regexValid || value === '') return null;
    return this.re!.test(value) === shouldMatch;
  }

  private validate(): { ok: boolean; cleanPos: string[]; cleanNeg: string[] } {
    const e: FormErrors = {};
    const re = this.re;

    if (!this.title().trim()) e.title = 'Il titolo è obbligatorio';
    if (!this.secretRegex().trim()) e.secretRegex = 'La regex è obbligatoria';
    else if (!re) e.secretRegex = 'La regex non è sintatticamente valida';

    if (!this.exampleMatch().trim()) e.exampleMatch = 'Obbligatorio';
    else if (re && !re.test(this.exampleMatch())) e.exampleMatch = 'Questo esempio non soddisfa la regex';

    if (!this.exampleNoMatch().trim()) e.exampleNoMatch = 'Obbligatorio';
    else if (re && re.test(this.exampleNoMatch()))
      e.exampleNoMatch = 'Questo esempio soddisfa la regex (non dovrebbe)';

    const cleanPos = this.positives().filter((s) => s !== '');
    const cleanNeg = this.negatives().filter((s) => s !== '');

    if (cleanPos.length < 1) e.positives = 'Aggiungi almeno una stringa positiva';
    else if (re && cleanPos.some((s) => !re.test(s)))
      e.positives = 'Tutte le stringhe positive devono soddisfare la regex';

    if (cleanNeg.length < 1) e.negatives = 'Aggiungi almeno una stringa negativa';
    else if (re && cleanNeg.some((s) => re.test(s)))
      e.negatives = 'Nessuna stringa negativa deve soddisfare la regex';

    this.errors.set(e);
    return { ok: Object.keys(e).length === 0, cleanPos, cleanNeg };
  }

  handleSubmit(): void {
    const { ok, cleanPos, cleanNeg } = this.validate();
    if (!ok) return;

    this.isPending.set(true);
    this.createError.set('');
    this.challengesApi
      .create({
        title: this.title().trim(),
        description: this.description().trim() || null,
        secretRegex: this.secretRegex(),
        exampleMatch: this.exampleMatch(),
        exampleNoMatch: this.exampleNoMatch(),
        controlStringsPositive: cleanPos,
        controlStringsNegative: cleanNeg,
      })
      .subscribe({
        next: (created) => {
          this.isPending.set(false);
          this.router.navigate(['/sfide', created.id]);
        },
        error: (err) => {
          this.isPending.set(false);
          this.createError.set(errorMessage(err, 'Creazione non riuscita'));
        },
      });
  }
}
