import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { filter, map, Subscription } from 'rxjs';
import { RoleConfigService } from '../services/role-config.service';
import { RoleService } from '../services/Role.service';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { IRole, RoleDto } from '../dto/Role.dto';
import { PermissionCategories } from './access-control/roleConfig';
import { IUser, UserDto } from '../dto/User.dto';
import { UserService } from '../services/User.service';
import { AuthService, User } from '@auth0/auth0-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  providers: [RoleConfigService, RoleService, UserService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  inputRoles: RoleDto[] | null = [];

  userRole: string | undefined = '';
  ResellerId: string | undefined = '';
  ResellerName: string | undefined = '';

    MerchantId: string | undefined = '';
  MerchantName: string | undefined = '';

  user: User | undefined = {};

  private subscription: Subscription = new Subscription();

  constructor(
    private primeng: PrimeNG,
    private roleConfigSerice: RoleConfigService,
    private roleService: RoleService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.primeng.ripple.set(true);
    // Vat
    if (!localStorage.getItem('VAT')) {
      localStorage.setItem('VAT', '18');
    }
    this.authService.user$.subscribe((user) => {
      if (user !== null) {
        this.user = user;
        this.userRole = this.user?.['user_metadata']['role'];
        
        if ((this.ResellerId = this.user?.['user_metadata']['resellerid'])) {
          localStorage.setItem('ResellerId', this.ResellerId || '');
        }

        if (
          (this.ResellerName = this.user?.['user_metadata']['resellername'])
        ) {
          localStorage.setItem('ResellerName', this.ResellerName || '');
        }

               if ((this.MerchantId = this.user?.['user_metadata']['merchantid'])) {
          localStorage.setItem('MerchantId', this.MerchantId || '');
        }

        if (
          (this.MerchantName = this.user?.['user_metadata']['merchantname'])
        ) {
          localStorage.setItem('MerchantName', this.MerchantName || '');
        }

        localStorage.setItem('roleName', this.userRole || '');
        this.findAllRole({});
      } else {
        this.userRole = undefined;
      }
    });
    // this.findAllRole({})
  }

  //--roles get--
  findAllRole(params: any) {
    this.subscription.add(
      this.roleService
        .findAllRole(params)
        .pipe(
          filter((res: HttpResponse<IRole[]>) => res.ok),
          map((res: HttpResponse<IRole[]>) => res.body)
        )
        .subscribe(
          (res: IRole[] | null) => {
            this.inputRoles = res;
            //--validate roles--
            this.handleRolesAuthentication();
          },

          (res: HttpErrorResponse) => {
            console.log('error in extracting all Role', res);
          }
        )
    );
  }

  //--handle authentication rules--
  handleRolesAuthentication() {
    //--check if available role is available--
    if (this.userRole) {
      if (this.userRole == 'Super-Admin') {
        //-check if super admin role available--
        const superAdminRole = this.inputRoles?.find((role) => {
          return role.Name === 'Super-Admin';
        });
        if (!superAdminRole?.RoleId) {
          //--create super admin role and user--
          this.createSuperAdminCredentials({
            Name: 'Super-Admin',
            //---!!!!!---this PermissionCategories must be hardcoded when generating app--
            PermissionCategories: PermissionCategories,
          });
        } else {
          //--super admin available--
          //--check super admin user available--
          this.validateSuperAdminRoleWithUser(superAdminRole);
        }
      } else {
        const userRoleStruct = this.inputRoles?.find((role) => {
          return role.Name === this.userRole;
        });
        if (userRoleStruct?.RoleId) {
          //--ok--
        } else {
          //--show error (no role available in that name)--
          console.error(
            'No role configuration available for user, please try again!'
          );
        }
      }
    } else {
      //--show error (no user role)--
      console.error(
        'Cannot get role configuration data from auth0, please try again!'
      );
    }
  }

  createSuperAdminCredentials(role: RoleDto) {
    this.roleConfigSerice
      .SendFirstLoginEmail({
        email: this.user?.email || '',
        userName: this.user?.name || '',
      })
      .subscribe({
        next: (res: HttpResponse<any>) => {},
        error: (err) => {
          console.error('Error sending email:', err);
        },
      });
    this.subscription.add(
      this.roleService
        .createRole(role)
        .pipe(
          filter((res: HttpResponse<IRole>) => res.ok),
          map((res: HttpResponse<IRole>) => res.body)
        )
        .subscribe(
          (res: IRole | null) => {
            if (res) {
              const fullName = this.user?.name || '';
              const nameParts = fullName.split(' ');
              const firstName = nameParts[0];
              const lastName = nameParts.slice(1).join(' ');

              this.createSuperAdminUser({
                FirstName: firstName,
                LastName: lastName,
                RoleId: role.RoleId,
                RoleName: role.Name,
                Email: this.user?.email || '',
              });
            } else {
              // Show error (Failed to create role)
              console.error(
                'Failed to create super admin role, please try again!'
              );
            }
          },
          (error) => {
            // Show error (Failed to create role)
            console.error(
              'Failed to create super admin role, please try again!'
            );
          }
        )
    );
  }

  createSuperAdminUser(user: UserDto) {
    this.subscription.add(
      this.userService.createUser(user).subscribe(
        () => {
          //--all done and refresh--
        },
        (error) => {
          // Check if the error response indicates that the user already exists
          if (
            error.error?.operation === 'Failed' &&
            error.error?.error === 'user already exists'
          ) {
            // Handle the specific error case (user already exists)
          } else {
            // Show general error if the error does not match the specific case
            console.error(
              'Failed to create super admin user, please try again!'
            );
          }
        }
      )
    );
  }

  validateSuperAdminRoleWithUser(role: RoleDto) {
    this.subscription.add(
      this.userService
        .findAllUser({})
        .pipe(
          filter((res: HttpResponse<IUser[]>) => res.ok),
          map((res: HttpResponse<IUser[]>) => res.body)
        )
        .subscribe(
          (res: IUser[] | null) => {
            const superAdminUser = res?.find((user) => {
              return user.RoleId === role.RoleId;
            });

            if (!superAdminUser?.UserId) {
              const fullName = this.user?.name || '';
              const nameParts = fullName.split(' ');
              const firstName = nameParts[0];
              const lastName = nameParts.slice(1).join(' ');

              //--no user for role--
              this.createSuperAdminUser({
                FirstName: firstName,
                LastName: lastName,
                RoleId: role.RoleId,
                RoleName: role.Name,
                Email: this.user?.email || '',
              });
            } else {
            }
          },

          (res: HttpErrorResponse) => {
            console.error(
              'Cannot get role configuration data from user, please try again!'
            );
          }
        )
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
