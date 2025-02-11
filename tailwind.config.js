/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./**/*.go",
        "./**/*.html",
        "./**/*.js",
    ],
    theme: {
      extend: {
        screens: {
            'xs': '480px',  // Extra small devices (portrait phones)
            'sm': '640px',  // Small devices (landscape phones)
            'md': '768px',  // Medium devices (tablets)
            'lg': '1024px', // Large devices (laptops)
            'xl': '1280px', // Extra large devices (desktops)
            '2xl': '1536px', // Double extra large devices (large desktops)
            '3xl': '1920px', // Triple extra large devices (ultra-wide monitors)
        },
        colors: {
        },
      },
    },
    plugins: [],
}