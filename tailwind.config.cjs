/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#1773cf",
                "background-light": "#f6f7f8",
                "background-dark": "#111921",
                "sepia-bg": "#F4ECD8",
                "sepia-text": "#1A1A1A",
                "sepia-secondary": "#5F584C",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "serif": ["Lora", "serif"],
                "noto": ["Noto Serif", "serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
