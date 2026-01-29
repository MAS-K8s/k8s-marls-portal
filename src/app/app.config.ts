import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import Noir from '../assets/themes/app-theme';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { provideAuth0 } from '@auth0/auth0-angular';
import { environment } from '../environments/environment';
import { AppInitializerService } from './app-initializer.service';
import { RoleService } from '../services/Role.service';
import { RoleConfigService } from '../services/role-config.service';
import { authH0ttpInterceptor } from './auth0..service';


export function initializeApp(appInitializer: AppInitializerService, roleConfigService: RoleConfigService) {
  return () => {
    return new Promise<void>((resolve) => {
      appInitializer.initializeRoles().subscribe({
        next: () => {
          resolve();
        },
        error: (err) => {
          console.error('Error during role initialization:', err);
          resolve();
        }
      });
    });
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withHashLocation()),
    provideAuth0(environment.auth0),
    provideAnimationsAsync(),
    AppInitializerService,
    RoleService,
    RoleConfigService,
    MessageService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitializerService, RoleConfigService],
      multi: true,
    },
    providePrimeNG({ theme: Noir, inputStyle: 'outlined' }),
    provideHttpClient(withInterceptors([authH0ttpInterceptor]))
]
};
