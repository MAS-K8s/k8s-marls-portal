import { AppConfigService } from '../../../services/appconfigservice';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem, SelectItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { KnobModule } from 'primeng/knob';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { TabMenuModule } from 'primeng/tabmenu';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { RippleModule } from 'primeng/ripple';
import { roleConfig } from '../../access-control/roleConfig';
import { Popover, PopoverModule } from 'primeng/popover';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationEvent,
} from '@angular/animations';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DropdownModule,
    CalendarModule,
    ChartModule,
    InputSwitchModule,
    ToggleSwitchModule,
    BadgeModule,
    TabMenuModule,
    FormsModule,
    DividerModule,
    AvatarModule,
    TooltipModule,
    DrawerModule,
    OverlayBadgeModule,
    KnobModule,
    ButtonModule,
    RippleModule,
    PopoverModule,
  ],
  templateUrl: './sidebar.component.html',
  animations: [
    trigger('submenuAnimation', [
      state(
        'collapsed',
        style({
          height: '0',
          opacity: 0,
          overflow: 'hidden',
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: 1,
        })
      ),
      transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
    ]),
  ],
  styles: [
    `
      .scrollbar-hide {
        overflow: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `,
  ],
})
export class MainsectionComponent implements OnInit {
  @ViewChild('op') op!: Popover;
  @ViewChild('popup') popup!: Popover;
  selectedSampleOption: any;

  sampleOptions: any;

  sampleAppsSidebarNavs: any[] = [];
  filteredMainItems: any[] = [];
  filteredOtherItems: any[] = [];
  productSubItems: any[] = [];

  sampleAppsSidebarNavsMore: any;

  selectedSampleAppsSidebarNav: any;
  selectedProductSubItem: string = '';

  isSlimMenu: boolean = false;
  isProductMenuExpanded: boolean = false;

  visibleRight: boolean = false;

  selectButtonValue: SelectItem | undefined;

  selectButtonOptions: SelectItem[] | undefined;

  items: MenuItem[] | undefined;

  configService = inject(AppConfigService);

  ProfileData: any;

  roleConfig = roleConfig;

  userRole: any;

  get isDarkMode(): boolean {
    return this.configService.appState().darkTheme;
  }

  toggle(event: any) {
    this.op.toggle(event);
  }

  toggleProductMenu() {
    if (!this.isSlimMenu || (this.isSlimMenu && this.isProductMenuExpanded)) {
      this.isProductMenuExpanded = !this.isProductMenuExpanded;
    } else if (this.isSlimMenu) {
      // Set the selected nav to 'Product' when expanding the menu
      // This will highlight the Product parent menu item and remove Dashboard highlighting
      this.isProductMenuExpanded = true;
    }

    if (this.isSlimMenu) {
      this.toggleSidebarPopover();
    }
  }

  private auth = inject(AuthService);

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updateSlimMenu(window.innerWidth);
  }

  getLogoSrc(): string {
    return !this.isDarkMode ? environment.LogoLight : environment.LogoDark;
  }

  logout() {
    this.op.hide();
    sessionStorage.removeItem('BranchId');
    this.auth.logout({ logoutParams: { returnTo: this.doc.location.origin } });
  }

  toggleSidebarPopover() {
    this.popup.toggle(event);
  }

  ngOnInit() {
    this.auth.user$.subscribe((user: any) => {
      if (user) {
        this.ProfileData = user;
        this.userRole = localStorage.getItem('roleName');
        this.filterSidebarNavs();
      }
    });

    this.updateSlimMenu(window.innerWidth);

    this.sampleAppsSidebarNavsMore = [];

    this.updateSelectedNav(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateSelectedNav(event.urlAfterRedirects || event.url);
      });
    this.selectButtonValue = { label: 'Styled', value: 1 };

    this.selectButtonOptions = [
      { label: 'Styled', value: 1 },
      { label: 'Unstyled', value: 2 },
    ];
  }

  LayoutClick(event: Event) {
    if (this.isSlimMenu) {
      event.stopPropagation();
      this.configService.toggleSidebar();
      this.popup.hide();
    }
  }

  toggleDarkMode() {
    this.configService.appState.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme,
    }));
  }

  private updateSlimMenu(width: number): void {
    const wasSlim = this.isSlimMenu;
    this.isSlimMenu = width < 768;
    if (wasSlim && !this.isSlimMenu) {
      this.isProductMenuExpanded =
        this.selectedSampleAppsSidebarNav === 'Product';
    }
  }

  private async updateSelectedNav(url: string): Promise<void> {
    await this.waitForRoleConfig();
    const baseUrl = url.split('?')[0];
    const matchingNav = this.sampleAppsSidebarNavs.find(
      (nav: any) => baseUrl === nav.routerLink && !nav.group
    );

    const matchingSubItem = this.productSubItems.find(
      (nav: any) => baseUrl === nav.routerLink
    );

    if (matchingSubItem) {
      this.selectedProductSubItem = matchingSubItem.title;
      this.selectedSampleAppsSidebarNav = matchingSubItem.title;
      this.isProductMenuExpanded = !this.isSlimMenu;
    } else {
      this.selectedProductSubItem = '';
      this.selectedSampleAppsSidebarNav = matchingNav
        ? matchingNav.title
        : 'Dashboard';
      if (
        !this.productSubItems.some(
          (item) => item.title === this.selectedSampleAppsSidebarNav
        )
      ) {
        this.isProductMenuExpanded = false;
      }
    }
  }

  private waitForRoleConfig(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (roleConfig && Object.keys(roleConfig).length > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  getRolesForService(serviceId: string): string[] {
    const roles: string[] = [];
    for (const role in this.roleConfig) {
      if (this.roleConfig[role]?.[serviceId] !== undefined) {
        roles.push(role);
      }
    }
    return roles;
  }

  filterSidebarNavs() {
    if (this.userRole) {
      const allNavItems = [
        { icon: 'pi pi-th-large', title: 'Dashboard', routerLink: '', id: '' },

        {
          icon: 'pi pi-sitemap', 
          title: 'Agent Decisions',
          routerLink: '/agent-decisions',
          id: 'DTO5226',
        },

        {
          icon: 'pi pi-box', // 
          title: 'Training Metrics',
          routerLink: '/training-metrics',
          id: 'DTO5225',
        },

        {
          icon: 'pi pi-upload', // ⬆️ Order to Admin
          title: 'Q-Value Analysis',
          routerLink: '/order-to-admin',
          id: 'DTO5228',
        },

        {
          icon: 'pi pi-server', // 👥 Customer Orders
          title: 'Deployment',
          routerLink: '/deployment',
          id: 'DTO5224',
        },

        {
          icon: 'pi pi-gauge', // 📩 Order to Merchant
          title: 'Performance',
          routerLink: '/order-to-merchant',
          id: 'DTO5227',
        },

        // {
        //   icon: 'pi pi-briefcase', // 💼 Merchants
        //   title: 'Merchants',
        //   routerLink: '/merchants',
        //   id: 'DTO5222',
        // },

        // {
        //   icon: 'pi pi-id-card', // 🪪 Resellers
        //   title: 'Resellers',
        //   routerLink: '/resellers',
        //   id: 'DTO5230',
        // },

        {
          icon: 'pi pi-user', // 👤 Customers
          title: 'Pod-Auto-Scaling',
          routerLink: '/pod-auto-scaling',
          id: 'DTO5223',
        },

        {
          icon: 'pi pi-file-excel',
          title: 'Reports',
          routerLink: '/report',
          // id: 'DTO5210',
        },
         {
          icon: 'pi pi-file-excel',
          title: 'Grafana',
          routerLink: '/grafana',
          // id: 'DTO5210',
        },
        {
          icon: 'pi pi-cog',
          title: 'Settings',
          routerLink: '/organization',
           id: 'DTO5232',
        },

        // Commented out items (keeping them in code but not showing in UI)
        /* 
        { icon: 'pi pi-users', title: 'Users', routerLink: '/user', id: 'DTO5212' },
        { icon: 'pi pi-sitemap', title: 'Branch', routerLink: '/branch', id: 'DTO5234' },
        { icon: 'pi pi-key', title: 'Role', routerLink: '/role', id: 'DTO5214' },
        */
      ];

      const filteredItems = allNavItems.filter((item) => {
        if (!item.id) {
          return true;
        }
        const allowedRoles = this.getRolesForService(item.id);
        return allowedRoles.includes(this.userRole as string);
      });

      this.sampleAppsSidebarNavs = filteredItems;

      this.filteredMainItems = filteredItems.filter(
        (item) => item.title === 'Dashboard'
      );

      this.filteredOtherItems = filteredItems.filter(
        (item) => item.title !== 'Dashboard'
      );
    }
  }
}
