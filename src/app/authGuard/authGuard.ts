import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { RoleConfigService } from '../../services/role-config.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private roleConfigService: RoleConfigService,
        private authService: AuthService
    ) {}
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> {
        return new Promise((resolve) => {
            this.authService.user$.subscribe((user) => {

                const userRole = user?.['user_metadata']?.['role'];
                const branchId = user?.['user_metadata']?.['branchid'];

                if (userRole === 'Branch-Manager' && branchId) {
                    sessionStorage.setItem('BranchId', branchId);
                }

                const currentUrl = state.url;
                const isPublicRoute =
                    currentUrl === '/' || currentUrl === '/overview';

                // if (!sessionStorage.getItem('BranchId')) {
                //     this.router.navigate(['']);
                //     resolve(false);
                //     return;
                // }
                if (isPublicRoute) {
                    resolve(true);
                    return;
                }

                this.roleConfigService.roleConfig$.subscribe((config) => {
                    if (!config || Object.keys(config).length === 0) {
                        return; 
                    }
                    
                    const dtoId = (route.data?.['requiredRoles'] as string) ?? '';
                    const requiredRoles = getRolesForService(dtoId, config);
                    const hasRequiredRole = requiredRoles.includes(userRole);
                    console.log('AuthGuard Check:',requiredRoles )
                    if (hasRequiredRole) {
                        resolve(true);
                    } else {
                        // this.router.navigate(['/notfound']);
                        resolve(true);
                    }
                });
            });
        });
    }
}


function getRolesForService(serviceId: string, config: any): string[] {
    const roles: string[] = [];
    for (const role in config) {
        if (config[role][serviceId] !== undefined) {
            roles.push(role);
        }
    }
    return roles;
}
