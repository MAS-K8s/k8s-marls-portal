import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const Noir = definePreset(Aura, {
    semantic: {
        "primary": {
            primary: {
                50: "#f2f2f2",
                100: "#c2c2c2",
                200: "#919191",
                300: "#616161",
                400: "#303030",
                500: "#000000",
                600: "#000000",
                700: "#000000",
                800: "#000000",
                900: "#000000",
                950: "#000000"
            },
        },
        "colorScheme": {
            "light": {
                "primary": {
                    "color": "{primary.500}",
                    "contrastColor": "#ffffff",
                    "hoverColor": "{primary.600}",
                    "activeColor": "{primary.700}"
                },
                "highlight": {
                    "background": "{primary.50}",
                    "focusBackground": "{primary.100}",
                    "color": "{primary.700}",
                    "focusColor": "{primary.800}"
                }
            },
            "dark": {
                "primary": {
                    "color": "{primary.400}",
                    "contrastColor": "{surface.900}",
                    "hoverColor": "{primary.300}",
                    "activeColor": "{primary.200}"
                },
                "highlight": {
                    "background": "color-mix(in srgb, {primary.400}, transparent 84%)",
                    "focusBackground": "color-mix(in srgb, {primary.400}, transparent 76%)",
                    "color": "rgba(255,255,255,.87)",
                    "focusColor": "rgba(255,255,255,.87)"
                }
            }
        }
    }
});

export default {
    preset: Noir,
    options: {
        darkModeSelector: '.p-dark'
    }
};
