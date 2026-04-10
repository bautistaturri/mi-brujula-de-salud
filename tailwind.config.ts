import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // DESIGN: Fuentes del sistema
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-inter)', 'sans-serif'],
        metric:  ['var(--font-metric)', 'ui-monospace', 'monospace'],
      },

      // DESIGN: Paleta del sistema de diseño — referencias a CSS variables
      // para respetar automáticamente el tema oscuro/claro
      colors: {
        // shadcn/ui tokens (necesarios para componentes)
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // DESIGN: Tokens de marca — theme-aware via CSS variables
        brand: {
          primary:         'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          'primary-soft':  'var(--brand-primary-soft)',
          secondary:       'var(--brand-secondary)',
          'secondary-soft':'var(--brand-secondary-soft)',
          accent:          'var(--brand-accent)',
          'accent-soft':   'var(--brand-accent-soft)',
        },

        // DESIGN: Superficies — theme-aware
        surface: {
          base:   'var(--surface-base)',
          card:   'var(--surface-card)',
          subtle: 'var(--surface-subtle)',
          hover:  'var(--surface-hover)',
        },

        // DESIGN: Texto — theme-aware
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          disabled:  'var(--text-disabled)',
        },

        // DESIGN: Estados semánticos — theme-aware (softs cambian en dark)
        status: {
          success:        '#10B981',
          'success-soft': 'var(--status-success-soft)',
          'success-text': 'var(--status-success-text)',
          warning:        '#F59E0B',
          'warning-soft': 'var(--status-warning-soft)',
          'warning-text': 'var(--status-warning-text)',
          danger:         '#EF4444',
          'danger-soft':  'var(--status-danger-soft)',
          'danger-text':  'var(--status-danger-text)',
          info:           '#3B82F6',
          'info-soft':    'var(--status-info-soft)',
          'info-text':    'var(--status-info-text)',
          error:          '#EF4444',
        },

        // DESIGN: Semáforos clínicos — theme-aware
        semaforo: {
          verde:              '#10B981',
          'verde-bg':         'var(--semaforo-verde-bg)',
          'verde-border':     'var(--semaforo-verde-border)',
          'verde-text':       'var(--semaforo-verde-text)',
          amarillo:           '#F59E0B',
          'amarillo-bg':      'var(--semaforo-amarillo-bg)',
          'amarillo-border':  'var(--semaforo-amarillo-border)',
          'amarillo-text':    'var(--semaforo-amarillo-text)',
          rojo:               '#EF4444',
          'rojo-bg':          'var(--semaforo-rojo-bg)',
          'rojo-border':      'var(--semaforo-rojo-border)',
          'rojo-text':        'var(--semaforo-rojo-text)',
        },

        // DESIGN: Bordes semánticos
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'border-focus':   'var(--border-focus)',
      },

      // DESIGN: Tipografía
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'h1':      ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2':      ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h3':      ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h4':      ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        'metric':  ['2.5rem', { lineHeight: '1', fontWeight: '700' }],
      },

      // DESIGN: Radios
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
        '3xl': '32px',
        DEFAULT: 'var(--radius)',
      },

      // DESIGN: Sombras
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'lg':     '0 10px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        'brand':  '0 4px 20px rgba(37,99,235,0.25)',
      },

      // DESIGN: Keyframes para animaciones
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        // LogroDesbloqueadoModal: card aparece con scale + fade
        "logro-in": {
          from: { opacity: "0", transform: "scale(0.88) translateY(16px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        // Ícono del logro cuando no hay video: pulso suave
        "logro-icon": {
          "0%, 100%": { transform: "scale(1)" },
          "50%":      { transform: "scale(1.1)" },
        },
        // Confetti cae desde arriba
        "confetti": {
          "0%":   { opacity: "1", transform: "translateY(-10px) rotate(0deg)" },
          "100%": { opacity: "0", transform: "translateY(120px) rotate(720deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "pulse-ring":     "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "fade-in-up":     "fade-in-up 0.4s ease-out both",
        "scale-in":       "scale-in 0.25s ease-out both",
        "count-up":       "count-up 0.5s ease-out both",
        "logro-in":       "logro-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
        "logro-icon":     "logro-icon 2s ease-in-out infinite",
        "confetti":       "confetti 1.5s ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
