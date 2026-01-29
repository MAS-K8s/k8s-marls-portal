import { AppState } from '../domain/appstate';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {

    private defaultSize = 13;

    private fontSize = new BehaviorSubject<number>(this.defaultSize);

    fontSize$ = this.fontSize.asObservable();

    private sideBarVisibility = new BehaviorSubject<boolean>(true);
    sideBarVisibility$ = this.sideBarVisibility.asObservable();

    state: AppState = {
        configActive: false,
        menuActive: false,
        newsActive: false
    };

    appState = signal<any>({
        preset: 'Aura',
        primary: 'amber',
        surface: 'slate',
        darkTheme: false,
    });

    document = inject(DOCUMENT);

    platformId = inject(PLATFORM_ID);

    theme = computed(() => (this.appState().darkTheme ? 'dark' : 'light'));


    constructor() {
        effect(() => {
            const state = this.appState();

            if (isPlatformBrowser(this.platformId)) {
                if (state.darkTheme) {
                    this.document.documentElement.classList.add('p-dark');
                } else {
                    this.document.documentElement.classList.remove('p-dark');
                }
            }
        });
    }

    setFontSize(size: number) {
        this.fontSize.next(size);
        document.documentElement.style.fontSize = `${size}px`;
      }
    
    showSidebar() {
        this.sideBarVisibility.next(true);
    }

    hideSidebar() {
        this.sideBarVisibility.next(false);
    } 
    
    toggleSidebar() {
        this.sideBarVisibility.next(!this.sideBarVisibility.value);
    }

    showMenu() {
        this.state.menuActive = true;
    }

    hideMenu() {
        this.state.menuActive = false;
    }

    showConfig() {
        this.state.configActive = true;
    }

    hideConfig() {
        this.state.configActive = false;
    }

    showNews() {
        this.state.newsActive = true;
    }

    hideNews() {
        this.state.newsActive = false;
    }

    getFontSize(): number {
        return this.fontSize.value;
    }

    increaseFontSize(step: number = 1) {
        this.setFontSize(this.fontSize.value + step);
    }

    decreaseFontSize(step: number = 1) {
        this.setFontSize(this.fontSize.value - step);
    }

    resetFontSize() {
        this.setFontSize(this.defaultSize);
    }
}
