module.exports = {
  theme: {
    extend: {},
    spinner: () => ({
      default: {
        color: '#dae1e7',
        size: '15em',
        border: '25px',
        speed: '1000ms',
      },
    }),
  },
 
  variants: {
    spinner: ['responsive'],
  },
 
  plugins: [
    require('tailwindcss-spinner')(),
  ],
}
