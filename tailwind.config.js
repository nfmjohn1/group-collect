/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./extension/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A69BD',
          light: '#6C8CD5',
          dark: '#3A5AA4',
        },
      },
    },
  },
  plugins: [],
}
