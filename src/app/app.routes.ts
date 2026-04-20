import { Routes } from '@angular/router';
import { AuthGuard as Auth0Guard } from '@auth0/auth0-angular';
import { AuthGuard } from './authGuard/authGuard';
import { AppmainComponent } from './layout/app.main.component';
import { DashboardComponent } from './layout/dashboard/dashboard.component';
import { AppNotfoundComponent } from './layout/notfound/app.notfound.component';
import { UserComponent } from '../pages/User/User.component';
import { RoleComponent } from '../pages/Role/Role.component';
import { AgentDecisionsComponent } from '../pages/Agent-Decisions/agent-decisions.component';
import { DeploymentsComponent } from '../pages/Deployments/deployments.component';
import { AgentAutoscalingComponent } from '../pages/Pod-AutoScaling/agent-autoscaling.component';
import { GrafanaComponent } from '../pages/grafana/grafana.component';
import { AgentMetricsComponent } from '../pages/Training-Metrics/agent-metrics.component';
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
        path: 'training-metrics',
        component: AgentMetricsComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5210' },
      },
      {
        path: 'agent-decisions',
        component: AgentDecisionsComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5210' },
      },
      {
        path: 'pod-auto-scaling',
        component: AgentAutoscalingComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5232' },
      },
      {
        path: 'deployment',
        component: DeploymentsComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5232' },
      },
      {
        path: 'grafana',
        component:GrafanaComponent,
        canActivate: [AuthGuard],
        data: { requiredRoles: 'DTO5232' },
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
