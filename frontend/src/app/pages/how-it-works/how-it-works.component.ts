import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

const DEMO_REGEX = '^[a-z]+$';

interface Step {
  n: number;
  title: string;
  text: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css',
})
export class HowItWorksComponent {
  demoRegex = DEMO_REGEX;
  input = signal('');

  steps: Step[] = [
    {
      n: 1,
      title: "L'autore crea la sfida",
      text: 'Sceglie una regex segreta e fornisce un esempio che la soddisfa e uno che non la soddisfa. Aggiunge fino a 10 stringhe di controllo positive e 10 negative, che restano nascoste.',
    },
    {
      n: 2,
      title: 'Tu proponi una regex',
      text: 'Non vedi la regex segreta: la devi dedurre dagli esempi pubblici. Inserisci la tua proposta e inviala.',
    },
    {
      n: 3,
      title: 'Il sistema confronta i comportamenti',
      text: 'La tua regex viene testata sulle stringhe di controllo segrete. Vedi quante positive soddisfi e quante negative escludi correttamente.',
    },
    {
      n: 4,
      title: 'Risolvi e scala la classifica',
      text: "La sfida è risolta quando la tua regex si comporta come l'originale su tutte le stringhe di controllo. Meno tentativi usi, meglio ti posizioni.",
    },
  ];

  get matches(): boolean | null {
    const value = this.input();
    if (!value) return null;
    try {
      return new RegExp(DEMO_REGEX).test(value);
    } catch {
      return null;
    }
  }

  onInputChange(value: string): void {
    this.input.set(value);
  }
}
