module.exports = {
    plugins: [
        require('@tailwindcss/postcss')(), // ✅ Correct for v4+
        require('autoprefixer'),
    ],
}
