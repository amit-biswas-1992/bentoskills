import Script from "next/script";

/**
 * Pre-hydration script that sets the theme class on <html> before the first
 * paint — prevents a flash of the wrong theme (FOUC) on first load.
 *
 * Precedence: localStorage("theme") → system preference → "light".
 *
 * Uses next/script with strategy="beforeInteractive" so Next inlines the
 * script into the HTML ahead of hydration, avoiding React 19's warning about
 * rendering raw <script> tags via JSX.
 */
const script = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored || (prefersDark ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export function ThemeScript() {
  return (
    <Script id="bentoskills-theme" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
