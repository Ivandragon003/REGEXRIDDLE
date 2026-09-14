import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChallengesApiService } from '../../core/api/challenges-api.service';
import { errorMessage } from '../../core/api/api.constants';

const MAX_CONTROL = 10;
type ControlKind = 'positive' | 'negative';

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
  controls: Record<ControlKind, ReturnType<typeof signal<string[]>>> = {
    positive: signal(['']),
    negative: signal(['']),
  };
  errors = signal<FormErrors>({});
  isPending = signal(false);
  createError = signal('');

  private readonly compiledRegex = computed(() => compileRegex(this.secretRegex()));

  get regexValid(): boolean {
    return this.secretRegex() !== '' && this.compiledRegex() !== null;
  }

  addControl(kind: ControlKind): void {
    const control = this.controls[kind];
    if (control().length < MAX_CONTROL) control.update((values) => [...values, '']);
  }
  removeControl(kind: ControlKind, index: number): void {
    this.controls[kind].update((values) => values.filter((_, current) => current !== index));
  }
  updateControl(kind: ControlKind, index: number, value: string): void {
    this.controls[kind].update((values) =>
      values.map((current, currentIndex) => (currentIndex === index ? value : current))
    );
  }

  controlStatus(value: string, shouldMatch: boolean): boolean | null {
    if (!this.regexValid || value === '') return null;
    return this.compiledRegex()!.test(value) === shouldMatch;
  }

  private validate(): { ok: boolean; cleanPos: string[]; cleanNeg: string[] } {
    const e: FormErrors = {};
    const re = this.compiledRegex();

    if (!this.title().trim()) e.title = 'Il titolo è obbligatorio';
    if (!this.secretRegex().trim()) e.secretRegex = 'La regex è obbligatoria';
    else if (!re) e.secretRegex = 'La regex non è sintatticamente valida';

    if (!this.exampleMatch().trim()) e.exampleMatch = 'Obbligatorio';
    else if (re && !re.test(this.exampleMatch())) e.exampleMatch = 'Questo esempio non soddisfa la regex';

    if (!this.exampleNoMatch().trim()) e.exampleNoMatch = 'Obbligatorio';
    else if (re && re.test(this.exampleNoMatch()))
      e.exampleNoMatch = 'Questo esempio soddisfa la regex (non dovrebbe)';

    const cleanPos = this.controls.positive().filter((s) => s !== '');
    const cleanNeg = this.controls.negative().filter((s) => s !== '');

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
