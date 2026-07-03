import { CommonModule } from '@angular/common';
import { Component, HostListener, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { AvatarComponent } from '../shared/avatar/avatar.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  auth = inject(AuthService);
  themeService = inject(ThemeService);

  menuOpen = signal(false);
  dropdownOpen = signal(false);

  // Chiude il dropdown cliccando fuori.
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const dropdown = this.elementRef.nativeElement.querySelector('[data-user-menu]');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.dropdownOpen.set(false);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((o) => !o);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleDropdown(): void {
    this.dropdownOpen.update((o) => !o);
  }

  handleLogout(): void {
    this.auth.logout();
    this.dropdownOpen.set(false);
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
