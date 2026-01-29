import { Component, HostListener, inject, OnInit } from '@angular/core';
import { AppConfigService } from '../../services/appconfigservice';
import { MainsectionComponent } from './sidebar/sidebar.component';
import { AppConfiguratorComponent } from './configurator/app.configurator.component';
import { Router, RouterOutlet } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { filter, map, Subscription } from 'rxjs';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    MainsectionComponent,
    AppConfiguratorComponent,
    RouterOutlet,
    DrawerModule,
    ButtonModule,
    ToastModule,
    SkeletonModule,
    Tooltip,
  ],
  templateUrl: './app.main.component.html',
  providers: [MessageService],
  animations: [
    trigger('sidebarSlide', [
      state('void', style({ transform: 'translateX(-100%)', opacity: 0 })), // Hidden
      state('*', style({ transform: 'translateX(0)', opacity: 1 })), // Visible
      transition('void => *', [animate('200ms ease-out')]), // Slide in
      transition('* => void', [animate('200ms ease-in')]), // Slide out
    ]),
  ],
})
export class AppmainComponent implements OnInit {
  visible: boolean = false;
  configService = inject(AppConfigService);
  sideBarVisibility: boolean = false;
  isSlimMenu: boolean = false;
  isDataLoading: boolean = false;
  subscription: Subscription = new Subscription();
  showSelectBranch: boolean = false;

  appConfigService = inject(AppConfigService);

  ResellerId: string | null = localStorage.getItem('ResellerId');
  MerchantId: string | null = localStorage.getItem('MerchantId');

  constructor(
    private messageService: MessageService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((user: any) => {
      if (user) {
        const userRole = user?.['user_metadata']?.['role'];
        if (userRole === 'Merchant') {
          this.router.navigate(['/update-reseller-merchant']);
        }
      }
    });
    this.updateSlimMenu(window.innerWidth);
  }

  navigatetoselectbranch() {
    this.router.navigate(['']);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  LayoutClick(event: Event, isNotLayout?: boolean) {
    if (isNotLayout) {
      this.appConfigService.showSidebar();
      event.stopImmediatePropagation();
      return;
    }

    if (this.isSlimMenu) {
      this.appConfigService.toggleSidebar();
    }
  }

  get landingClass() {
    return {
      'layout-dark': this.isDarkMode,
      'layout-light': !this.isDarkMode,
    };
  }

  get isDarkMode() {
    return this.configService.appState().darkTheme;
  }

  private updateSlimMenu(width: number): void {
    if (width < 768) {
      this.isSlimMenu = true;
      this.appConfigService.hideSidebar();
    } else {
      this.isSlimMenu = false;
      this.appConfigService.showSidebar();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updateSlimMenu(window.innerWidth);
  }

}
