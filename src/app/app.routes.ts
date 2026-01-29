import { Routes } from '@angular/router';
import { AuthGuard as Auth0Guard } from '@auth0/auth0-angular';
import { AuthGuard } from './authGuard/authGuard';
import { AppmainComponent } from './layout/app.main.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { AppNotfoundComponent } from './layout/notfound/app.notfound.component';
import { UserComponent } from '../pages/User/User.component';
import { RoleComponent } from '../pages/Role/Role.component';

import { SupplierComponent } from '../pages/Supplier/Supplier.component';

import { ReportComponent } from '../pages/Report/Report.component';
import { OrganizationComponent } from '../pages/Organization/Organization.component';

export const routes: Routes = [
  {
    path: '',
    component: AppmainComponent,
    canActivate: [Auth0Guard],
    children: [
      { path: '', canActivate: [AuthGuard], component: DashboardComponent },
      {
        path: 'overview',
        canActivate: [AuthGuard],
        component: DashboardComponent,
      },
      {
        path: 'user',
        component: UserComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5212' },
      },
      {
        path: 'role',
        component: RoleComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5214' },
      },


      {
        path: 'report',
        component: ReportComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5210' },
      },

            {
        path: 'organization',
        component: OrganizationComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5232' },
      },
    ],
  },
  { path: 'notfound', component: AppNotfoundComponent },
  { path: '**', redirectTo: '/notfound' },
];
