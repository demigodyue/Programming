// Tailwind CSS v4 through PostCSS, which both bundlers read. The site builds with webpack (package.json "build"):
// Windows Smart App Control blocks Next's native compiler on this machine, and Turbopack has no WebAssembly fallback.
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
