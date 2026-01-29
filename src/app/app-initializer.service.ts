import { Injectable, inject } from '@angular/core';
import { RoleService } from '../services/Role.service';
import { RoleConfigService } from '../services/role-config.service';
import { HttpResponse } from '@angular/common/http';
import { IRole, transformRolesToRoleConfig } from '../dto/Role.dto';
import { map, filter, switchMap, catchError } from 'rxjs/operators';
import { Observable, of, from } from 'rxjs';
import { roleConfig } from '../app/access-control/roleConfig';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root',
})
export class AppInitializerService {
  private authService = inject(AuthService);

  constructor(
    private roleService: RoleService,
    private roleConfigService: RoleConfigService
  ) {}

  /**
   * Initialize roles and update the role configuration.
   * This method is called during the app initialization phase.
   * It now ensures Auth0 token is available before making API calls.
   */
  initializeRoles(): Observable<void> {
    return this.authService.isAuthenticated$.pipe(
      switchMap(isAuthenticated => {
        if (isAuthenticated) {

          return this.authService.getAccessTokenSilently().pipe(
            switchMap(() => this.fetchAndProcessRoles()),
            catchError(error => {
              console.error('Error initializing roles:', error);
              return of(undefined);
            })
          );
        } else {
          return of(undefined);
        }
      })
    );
  }

  /**
   * Fetch and process roles using the existing implementation
   */
  private fetchAndProcessRoles(): Observable<void> {
    return this.roleService.findAllRole({}).pipe(
      filter((res: HttpResponse<IRole[]>) => res.ok),
      map((res: HttpResponse<IRole[]>) => res.body || []),
      map((roles: IRole[]) => {
        const transformedConfig = transformRolesToRoleConfig(roles);
        Object.assign(roleConfig, transformedConfig);
        this.roleConfigService.setRoleConfig(roleConfig);
      }),
      map(() => undefined), 
      catchError(error => {
        console.error('Error fetching roles:', error);
        return of(undefined);
      })
    );
  }
}  