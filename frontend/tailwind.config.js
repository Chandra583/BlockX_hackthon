/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VERIDRIVE Brand Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Role-based colors
        admin: '#dc2626',      // Red for admin
        owner: '#7c3aed',      // Purple for owner
        buyer: '#16a34a',      // Green for buyer
        service: '#ea580c',    // Orange for service
        insurance: '#2563eb',  // Blue for insurance
        government: '#ca8a04', // Yellow for government
        // Solana colors
        solana: {
          purple: '#7c3aed',
          cyan: '#06b6d4',
          gradient: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'solana-gradient': 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounce 1s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      focus: {
        outline: '2px solid #7c3aed',
        'outline-offset': '2px',
      },
    },
  },
  plugins: [],
} 