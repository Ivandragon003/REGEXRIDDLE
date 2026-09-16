import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Step {
  n: number;
  title: string;
  text: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css',
})
export class HowItWorksComponent {
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

}
