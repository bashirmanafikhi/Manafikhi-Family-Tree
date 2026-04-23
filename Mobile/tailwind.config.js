/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#bc6798',
                    50: '#fdf2f8',
                    100: '#fce7f3',
                    200: '#f9d5e3',
                    300: '#f5b8cd',
                    400: '#ed8eb3',
                    500: '#e06499',
                    600: '#bc6798',
                    700: '#9b4d7a',
                    800: '#7a3d5f',
                    900: '#592e47',
                },
                surface: {
                    light: '#f5f5f5',
                    dark: '#2a2a2a',
                },
                bg: {
                    primary: '#FFFFFF',
                    secondary: '#F5F5F5',
                    dark: '#1a1a1a',
                    'dark-secondary': '#2a2a2a',
                },
                text: {
                    primary: '#1A1A1A',
                    secondary: '#666666',
                    dark: '#FFFFFF',
                    'dark-secondary': '#aaaaaa',
                },
                border: {
                    DEFAULT: '#e0e0e0',
                    dark: '#444444',
                },
                card: {
                    DEFAULT: '#FFFFFF',
                    dark: '#333333',
                },
            },
            fontFamily: {
                sans: ['system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};