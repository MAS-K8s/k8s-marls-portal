import { Component, inject } from '@angular/core';
import { AppConfigService } from '../../../services/appconfigservice';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-notfound',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './app.notfound.component.html',
})
export class AppNotfoundComponent {
  configService = inject(AppConfigService);

  getLogoSrc(): string {
    return this.isDarkMode
      ? '#'
      : '#';
  }

  get isDarkMode(): boolean {
    return this.configService.appState().darkTheme;
  }
}
