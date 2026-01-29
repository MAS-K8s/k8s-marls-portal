import { AppConfigService } from '../../../services/appconfigservice';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { $t, updatePreset, updateSurfacePalette } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Material from '@primeng/themes/material';
import Nora from '@primeng/themes/nora';
import { ButtonModule } from 'primeng/button';
import { PrimeNG } from 'primeng/config';
import { DividerModule } from 'primeng/divider';
import { InputSwitchModule } from 'primeng/inputswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButton, SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToggleButton } from 'primeng/togglebutton';
import { LucideAngularModule, Palette, Monitor, Sun, Moon, Type } from 'lucide-angular';

const presets = {
    Aura,
    Material,
    Lara,
    Nora
};

const STORAGE_KEY = 'app_theme_config';

@Component({
    selector: 'app-configurator',
    standalone: true,
    template: `
    <div class="config-panel-content">
      <div class="config-section">
        <div class="section-header">
        <lucide-icon [img]="Palette" class="section-icon"></lucide-icon>
          <h3>Theme Colors</h3>
        </div>
        
        <div class="config-panel-colors">
          <span class="config-panel-label">Primary</span>
          <div class="color-buttons">
            @for (primaryColor of primaryColors(); track primaryColor) {
              <button
                type="button"
                [title]="primaryColor.name"
                (click)="updateColors($event, 'primary', primaryColor)"
                [ngClass]="{ 'active-color': primaryColor.name === selectedPrimaryColor() }"
                [style]="{
                  'background-color': primaryColor?.name === 'noir'
                    ? 'var(--text-color)'
                    : primaryColor?.palette?.['500'] || 'transparent'
                }"
              ></button>
            }
          </div>
        </div>

        <div class="config-panel-colors">
          <span class="config-panel-label">Surface</span>
          <div class="color-buttons">
            @for (surface of surfaces; track surface) {
              <button
                type="button"
                [title]="surface.name"
                (click)="updateColors($event, 'surface', surface)"
                [ngClass]="{ 'active-color': surface.name === selectedSurfaceColor() }"
                [style]="{
                  'background-color': surface.name === 'noir'
                    ? 'var(--text-color)'
                    : surface!.palette['500']
                }"
              ></button>
            }
          </div>
        </div>
      </div>

      <p-divider />

      <div class="config-section">
        <div class="section-header">
          <lucide-icon [img]="Monitor" class="section-icon"></lucide-icon>
          <h3>Display Settings</h3>
        </div>

        <div class="config-panel-settings">
        <div class="setting-item">
  <span class="config-panel-label">{{isDarkMode? 'Light' : 'Dark'}} Mode</span>
  <lucide-icon [img]="Moon" class="section-icon" *ngIf="isDarkMode"></lucide-icon>
  <lucide-icon [img]="Sun" class="section-icon" *ngIf="!isDarkMode"></lucide-icon>
  <p-inputSwitch
    [(ngModel)]="isDarkMode"
    (ngModelChange)="toggleDarkMode()"
  >
  </p-inputSwitch>
</div>

          <div class="setting-item">
            <span class="config-panel-label">Ripple Effect</span>
            <p-inputSwitch [(ngModel)]="ripple" (ngModelChange)="saveThemeConfig()" />
          </div>
        </div>
      </div>

      <p-divider />

      <div class="config-section">
        <div class="section-header">
          <lucide-icon [img]="Type" class="section-icon"></lucide-icon>
          <h3>Typography</h3>
        </div>

        <div class="font-controls">
          <p-button
            icon="pi pi-minus"
            (click)="decreaseFont()"
            [rounded]="true"
            [text]="true"
            severity="secondary"
          />
          <span class="font-size-display">{{ currentSize }}px</span>
          <p-button
            icon="pi pi-plus"
            (click)="increaseFont()"
            [rounded]="true"
            [text]="true"
            severity="secondary"
          />
          <p-button
            label="Reset"
            (click)="resetFont()"
            [rounded]="true"
            [outlined]="true"
            severity="secondary"
          />
        </div>
      </div>

      <p-divider />

      <div class="config-section">
        <span class="config-panel-label">Presets</span>
        <p-selectButton
          [options]="presets"
          [ngModel]="selectedPreset()"
          (ngModelChange)="onPresetChange($event)"
          [allowEmpty]="false"
          size="small"
        />
      </div>
    </div>
    `,
    imports: [CommonModule, FormsModule, InputSwitchModule, ButtonModule, RadioButtonModule, SelectButton, ToggleSwitchModule, SelectButtonModule,
        ToggleButton,
        DividerModule,
        LucideAngularModule],
    styles: [`
            $panel-padding: 1.5rem;
    $color-button-size: 2rem;
    $border-radius: 0.5rem;
    $transition-duration: 0.2s;

    .config-panel-content {
      padding: $panel-padding;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 400px;
      margin: 0 auto;
    }

    .config-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 0.5rem;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
      }

      .section-icon {
        width: 1.25rem;
        height: 1.25rem;
        color: var(--primary-color);
      }
    }

    .config-panel-label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--text-secondary-color);
      letter-spacing: 0.5px;
    }

    .color-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      button {
        width: $color-button-size;
        height: $color-button-size;
        border-radius: $border-radius;
        border: 1px solid var(--surface-border);
        outline: none;
        cursor: pointer;
        transition: all $transition-duration ease-in-out;
        position: relative;

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        &.active-color {
          &::after {
            content: '';
            position: absolute;
            top: -3px;
            left: -3px;
            right: -3px;
            bottom: -3px;
            border: 2px solid var(--primary-color);
            border-radius: calc($border-radius + 2px);
            opacity: 0.8;
          }
        }
      }
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;

      .config-panel-label {
        margin: 0;
      }
    }

    .mode-icon {
      width: 1rem;
      height: 1rem;
      color: var(--primary-color);
    }

    .font-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--surface-card);
      border-radius: $border-radius;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

      .font-size-display {
        font-weight: 500;
        color: var(--text-color);
        min-width: 3.5rem;
        text-align: center;
        background: var(--surface-hover);
        padding: 0.375rem 0.75rem;
        border-radius: $border-radius;
      }
    }

    :host-context(.dark) {
      .color-buttons button {
        border-color: rgba(255, 255, 255, 0.1);
        
        &:hover {
          box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
        }
      }

      .font-controls {
        background: var(--surface-hover);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }

    @media (max-width: 768px) {
      .config-panel-content {
        padding: 1rem;
      }

      .font-controls {
        flex-wrap: wrap;
        justify-content: center;
        
        .font-size-display {
          order: -1;
          width: 100%;
          margin-bottom: 0.5rem;
        }
      }
    }`]
})
export class AppConfiguratorComponent implements OnInit {
    Palette = Palette;
    Monitor = Monitor;
    Moon = Moon;
    Sun = Sun;
    Type = Type;

    currentSize: number | undefined;
    isDarkMode: any;

    get ripple() {
        return this.config.ripple();
    }

    set ripple(value: boolean) {
        this.config.ripple.set(value);
    }

    constructor() {
        this.currentSize = this.configService.getFontSize();
    }

    ngOnInit() {
        this.loadThemeFromStorage();
    }

    loadThemeFromStorage() {
        try {
            const storedConfig = localStorage.getItem(STORAGE_KEY);
            
            if (storedConfig) {
                const config = JSON.parse(storedConfig);
                
                this.configService.appState.update(state => ({
                    ...state,
                    primary: config.primary || state.primary,
                    surface: config.surface || state.surface,
                    preset: config.preset || state.preset,
                    darkTheme: config.darkTheme !== undefined ? config.darkTheme : state.darkTheme
                }));
                
                this.isDarkMode = config.darkTheme;
                
                if (config.ripple !== undefined) {
                    this.config.ripple.set(config.ripple);
                }
                
                if (config.fontSize) {
                    this.configService.setFontSize(config.fontSize);
                    this.currentSize = config.fontSize;
                }
                
                const selectedPresetValue = config.preset || this.selectedPreset();
                if (selectedPresetValue) {
                    this.onPresetChange(selectedPresetValue, false);
                }
                
                if (config.primary) {
                    const primaryColor = this.primaryColors().find(c => c.name === config.primary);
                    if (primaryColor) {
                        this.applyTheme('primary', primaryColor);
                    }
                }
                
                if (config.surface) {
                    const surfaceColor = this.surfaces.find(s => s.name === config.surface);
                    if (surfaceColor) {
                        this.applyTheme('surface', surfaceColor);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading theme from local storage:', error);
        }
    }

    saveThemeConfig() {
        try {
            const config = {
                primary: this.selectedPrimaryColor(),
                surface: this.selectedSurfaceColor(),
                preset: this.selectedPreset(),
                darkTheme: this.configService.appState().darkTheme,
                ripple: this.ripple,
                fontSize: this.currentSize
            };
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('Error saving theme to local storage:', error);
        }
    }

    increaseFont() {
        this.configService.increaseFontSize();
        this.currentSize = this.configService.getFontSize();
        this.saveThemeConfig();
    }

    decreaseFont() {
        this.configService.decreaseFontSize();
        this.currentSize = this.configService.getFontSize();
        this.saveThemeConfig();
    }

    resetFont() {
        this.configService.resetFontSize();
        this.currentSize = this.configService.getFontSize();
        this.saveThemeConfig();
    }

    toggleDarkMode() {
        this.configService.appState.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
        this.saveThemeConfig();
    }

    config: PrimeNG = inject(PrimeNG);

    configService: AppConfigService = inject(AppConfigService);

    presets = Object.keys(presets);

    surfaces = [
        {
            name: 'slate',
            palette: {
                0: '#ffffff',
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a',
                950: '#020617'
            }
        },
        {
            name: 'gray',
            palette: {
                0: '#ffffff',
                50: '#f9fafb',
                100: '#f3f4f6',
                200: '#e5e7eb',
                300: '#d1d5db',
                400: '#9ca3af',
                500: '#6b7280',
                600: '#4b5563',
                700: '#374151',
                800: '#1f2937',
                900: '#111827',
                950: '#030712'
            }
        },
        {
            name: 'zinc',
            palette: {
                0: '#ffffff',
                50: '#fafafa',
                100: '#f4f4f5',
                200: '#e4e4e7',
                300: '#d4d4d8',
                400: '#a1a1aa',
                500: '#71717a',
                600: '#52525b',
                700: '#3f3f46',
                800: '#27272a',
                900: '#18181b',
                950: '#09090b'
            }
        },
        {
            name: 'neutral',
            palette: {
                0: '#ffffff',
                50: '#fafafa',
                100: '#f5f5f5',
                200: '#e5e5e5',
                300: '#d4d4d4',
                400: '#a3a3a3',
                500: '#737373',
                600: '#525252',
                700: '#404040',
                800: '#262626',
                900: '#171717',
                950: '#0a0a0a'
            }
        },
        {
            name: 'stone',
            palette: {
                0: '#ffffff',
                50: '#fafaf9',
                100: '#f5f5f4',
                200: '#e7e5e4',
                300: '#d6d3d1',
                400: '#a8a29e',
                500: '#78716c',
                600: '#57534e',
                700: '#44403c',
                800: '#292524',
                900: '#1c1917',
                950: '#0c0a09'
            }
        },
        {
            name: 'soho',
            palette: {
                0: '#ffffff',
                50: '#f4f4f4',
                100: '#e8e9e9',
                200: '#d2d2d4',
                300: '#bbbcbe',
                400: '#a5a5a9',
                500: '#8e8f93',
                600: '#77787d',
                700: '#616268',
                800: '#4a4b52',
                900: '#34343d',
                950: '#1d1e27'
            }
        },
        {
            name: 'viva',
            palette: {
                0: '#ffffff',
                50: '#f3f3f3',
                100: '#e7e7e8',
                200: '#cfd0d0',
                300: '#b7b8b9',
                400: '#9fa1a1',
                500: '#87898a',
                600: '#6e7173',
                700: '#565a5b',
                800: '#3e4244',
                900: '#262b2c',
                950: '#0e1315'
            }
        },
        {
            name: 'ocean',
            palette: {
                0: '#ffffff',
                50: '#fbfcfc',
                100: '#F7F9F8',
                200: '#EFF3F2',
                300: '#DADEDD',
                400: '#B1B7B6',
                500: '#828787',
                600: '#5F7274',
                700: '#415B61',
                800: '#29444E',
                900: '#183240',
                950: '#0c1920'
            }
        }
    ];

    selectedPrimaryColor = computed(() => {
      return this.configService.appState().primary;
  });

  selectedSurfaceColor = computed(() => this.configService.appState().surface);

  selectedPreset = computed(() => this.configService.appState().preset);

  primaryColors = computed(() => {
      type PresetKeys = keyof typeof presets;

      const presetKey = this.configService.appState().preset as PresetKeys;

      const presetPalette: Record<string, Record<string, string>> = presets[presetKey]?.primitive || {};

      const colors = [
          'emerald', 'green', 'lime', 'orange', 'amber', 'yellow',
          'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet',
          'purple', 'fuchsia', 'pink', 'rose'
      ];

      const palettes = [{ name: 'noir', palette: {} as Record<string, string> }];

      colors.forEach((color) => {
          palettes.push({
              name: color,
              palette: presetPalette[color] || {}
          });
      });

      return palettes;
  });

  getPresetExt() {
      const color = this.primaryColors().find((c) => c.name === this.selectedPrimaryColor());
      if (color!.name === 'noir') {
          return {
              semantic: {
                  primary: {
                      50: '{surface.50}',
                      100: '{surface.100}',
                      200: '{surface.200}',
                      300: '{surface.300}',
                      400: '{surface.400}',
                      500: '{surface.500}',
                      600: '{surface.600}',
                      700: '{surface.700}',
                      800: '{surface.800}',
                      900: '{surface.900}',
                      950: '{surface.950}'
                  },
                  colorScheme: {
                      light: {
                          primary: {
                              color: '{primary.950}',
                              contrastColor: '#ffffff',
                              hoverColor: '{primary.800}',
                              activeColor: '{primary.700}'
                          },
                          highlight: {
                              background: '{primary.950}',
                              focusBackground: '{primary.700}',
                              color: '#ffffff',
                              focusColor: '#ffffff'
                          }
                      },
                      dark: {
                          primary: {
                              color: '{primary.50}',
                              contrastColor: '{primary.950}',
                              hoverColor: '{primary.200}',
                              activeColor: '{primary.300}'
                          },
                          highlight: {
                              background: '{primary.50}',
                              focusBackground: '{primary.300}',
                              color: '{primary.950}',
                              focusColor: '{primary.950}'
                          }
                      }
                  }
              }
          };
      } else {
          if (this.configService.appState().preset === 'Nora') {
              return {
                  semantic: {
                      primary: color!.palette,
                      colorScheme: {
                          light: {
                              primary: {
                                  color: '{primary.600}',
                                  contrastColor: '#ffffff',
                                  hoverColor: '{primary.700}',
                                  activeColor: '{primary.800}'
                              },
                              highlight: {
                                  background: '{primary.600}',
                                  focusBackground: '{primary.700}',
                                  color: '#ffffff',
                                  focusColor: '#ffffff'
                              }
                          },
                          dark: {
                              primary: {
                                  color: '{primary.500}',
                                  contrastColor: '{surface.900}',
                                  hoverColor: '{primary.400}',
                                  activeColor: '{primary.300}'
                              },
                              highlight: {
                                  background: '{primary.500}',
                                  focusBackground: '{primary.400}',
                                  color: '{surface.900}',
                                  focusColor: '{surface.900}'
                              }
                          }
                      }
                  }
              };
          } else if (this.configService.appState().preset === 'Material') {
              return {
                  semantic: {
                      primary: color!.palette,
                      colorScheme: {
                          light: {
                              primary: {
                                  color: '{primary.500}',
                                  contrastColor: '#ffffff',
                                  hoverColor: '{primary.400}',
                                  activeColor: '{primary.300}'
                              },
                              highlight: {
                                  background: 'color-mix(in srgb, {primary.color}, transparent 88%)',
                                  focusBackground: 'color-mix(in srgb, {primary.color}, transparent 76%)',
                                  color: '{primary.700}',
                                  focusColor: '{primary.800}'
                              }
                          },
                          dark: {
                              primary: {
                                  color: '{primary.400}',
                                  contrastColor: '{surface.900}',
                                  hoverColor: '{primary.300}',
                                  activeColor: '{primary.200}'
                              },
                              highlight: {
                                  background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                                  focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                                  color: 'rgba(255,255,255,.87)',
                                  focusColor: 'rgba(255,255,255,.87)'
                              }
                          }
                      }
                  }
              };
          } else {
              return {
                  semantic: {
                      primary: color!.palette,
                      colorScheme: {
                          light: {
                              primary: {
                                  color: '{primary.500}',
                                  contrastColor: '#ffffff',
                                  hoverColor: '{primary.600}',
                                  activeColor: '{primary.700}'
                              },
                              highlight: {
                                  background: '{primary.50}',
                                  focusBackground: '{primary.100}',
                                  color: '{primary.700}',
                                  focusColor: '{primary.800}'
                              }
                          },
                          dark: {
                              primary: {
                                  color: '{primary.400}',
                                  contrastColor: '{surface.900}',
                                  hoverColor: '{primary.300}',
                                  activeColor: '{primary.200}'
                              },
                              highlight: {
                                  background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                                  focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                                  color: 'rgba(255,255,255,.87)',
                                  focusColor: 'rgba(255,255,255,.87)'
                              }
                          }
                      }
                  }
              };
          }
      }
  }

  updateColors(event: any, type: string, color: any) {
      if (type === 'primary') {
          this.configService.appState.update((state) => ({ ...state, primary: color.name }));
      } else if (type === 'surface') {
          this.configService.appState.update((state) => ({ ...state, surface: color.name }));
      }
          
      this.applyTheme(type, color);
      
      this.saveThemeConfig();

      event.stopPropagation();
  }

  applyTheme(type: string, color: any) {
      if (type === 'primary') {
          updatePreset(this.getPresetExt());
      } else if (type === 'surface') {
          updateSurfacePalette(color.palette);
      }
  }

  onPresetChange(event: any, saveToStorage: boolean = true) {
      this.configService.appState.update((state) => ({ ...state, preset: event }));
      type PresetKeys = keyof typeof presets;
      const preset = (event in presets ? presets[event as PresetKeys] : undefined) || "default value";
      const surfacePalette = this.surfaces.find((s) => s.name === this.selectedSurfaceColor())?.palette;
      
      if (this.configService.appState().preset === 'Material') {
          document.body.classList.add('material');
          this.config.ripple.set(true);
      } else {
          document.body.classList.remove('material');
      }
      
      $t().preset(preset).preset(this.getPresetExt()).surfacePalette(surfacePalette).use({ useDefaultOptions: true });
      
      if (saveToStorage) {
          this.saveThemeConfig();
      }
  }
}