/**
 * Inline script that runs before hydration to set the theme class on <html>.
 * Prevents a flash of the wrong theme (FOUC) on first paint.
 *
 * Precedence: localStorage("theme") → system preference → "light".
 */
export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem("theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = stored || (prefersDark ? "dark" : "light");
        if (theme === "dark") document.documentElement.classList.add("dark");
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
