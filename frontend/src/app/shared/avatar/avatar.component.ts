import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { resolveAssetUrl } from '../../core/api/api.constants';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  @Input() username: string | null | undefined = '';
  @Input() avatarUrl: string | null | undefined = null;
  @Input() size = 36;

  get src(): string | null {
    return resolveAssetUrl(this.avatarUrl);
  }

  get initial(): string {
    return (this.username || '?').charAt(0).toUpperCase();
  }

  get dimensionStyle(): Record<string, string> {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`,
      fontSize: `${this.size * 0.45}px`,
    };
  }
}
