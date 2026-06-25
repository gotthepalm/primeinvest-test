# PrimeInvest Landing Page

Responsive one-page marketing landing built with plain HTML, CSS, and vanilla JavaScript.

## How to Run

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
npx serve .
```

No build step or framework is required.

## Project Structure

```text
.
+-- index.html
+-- styles.css
+-- script.js
L-- README.md
```

## Notes

- Mobile-first CSS with breakpoints at `360px`, `768px`, `1024px`, and `1280px+`.
- Countdown is stored in `sessionStorage` and starts on the first visit in the current browser session.
- Sticky CTA appears after scrolling and switches from bottom placement on mobile to top placement on tablet/desktop.
- Slider supports pointer swipe, arrow controls, and pagination dots.
- Lead form validates client-side and shows a success modal without page reload.
- Images are remote raster assets with explicit dimensions, lazy loading where appropriate, and optimized query parameters.
