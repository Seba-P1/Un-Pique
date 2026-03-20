# Frontend Architecture Standards

## 1. Tech Stack Selection
- **Frameworks:** React.js, Next.js, or Vue/Nuxt for web. React Native (Expo) or Flutter for cross-platform mobile.
- **State Management:** Use atomic or flux-based tools (Zustand, Redux Toolkit) for global state. Use Server-State tools (React Query, SWR) for caching and fetching data.
- **Styling:** Tailwind CSS for utility-first styling, paired with component systems like Radix UI or shadcn/ui for accessible primitives.

## 2. Component Architecture
- **Atomic Design:** Build from primitive atoms (Buttons, Inputs) to molecules (Forms) and organisms (Layouts).
- **Separation of Concerns:** Separate business logic (Custom Hooks) from UI rendering (Presentational Components).
- **Component Reusability:** Ensure components accept standard properties (`className`, `style`) and correctly forward refs.

## 3. Performance Optimization (Core Web Vitals)
- **LCP (Largest Contentful Paint):** Optimize critical rendering paths. Prioritize above-the-fold content and defer non-critical JS.
- **CLS (Cumulative Layout Shift):** Specify explicit dimensions for images/ads and pre-allocate layout space for dynamically injected content.
- **INP (Interaction to Next Paint):** Use Web Workers for heavy computations, debounce fast-firing events, and utilize Concurrent React features.

## 4. Code Quality and Typing
- **TypeScript Strict Mode:** Enforce 100% strict typing. Avoid `any` types; prefer `unknown` with type narrowing.
- **Linting & Formatting:** Standardize formatting with Prettier and enforce code health with ESLint (using rules like `eslint-plugin-react-hooks`).
- **Bundle Size Management:** Use dynamic imports (`React.lazy`, Next.js `dynamic`) for code splitting. Monitor bundle size via Webpack/Vite analyzers.

## 5. SEO and Server-Side Rendering (SSR)
- **Meta Tags:** Dynamically manage title, description, and OpenGraph tags per page.
- **Semantic HTML:** Use proper HTML5 semantic tags (`<article>`, `<nav>`, `<aside>`) to improve machine readability.
- **Rendering Strategies:** Utilize Static Site Generation (SSG) for public content and Server-Side Rendering (SSR) for dynamic, personalized user contexts.
