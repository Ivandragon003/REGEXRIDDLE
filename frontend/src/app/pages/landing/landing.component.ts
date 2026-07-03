import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  features: Feature[] = [
    {
      icon: '+',
      title: 'Crea',
      text: 'Definisci una regex segreta, due esempi pubblici e le stringhe di controllo nascoste.',
    },
    {
      icon: '/',
      title: 'Risolvi',
      text: 'Proponi la tua regex e scopri quante stringhe di controllo soddisfi ad ogni tentativo.',
    },
    {
      icon: '#',
      title: 'Scala la classifica',
      text: 'Più sfide risolvi e meno tentativi usi, più sali nella classifica globale.',
    },
  ];

  terminal = `$ regexriddle solve --challenge "email"
> tentativo: ^[\\w.-]+@[\\w.-]+\\.[a-z]+$
  positive: 2/2  ✓
  negative: 3/3  ✓
> sfida risolta in 3 tentativi 🎉`;
}
