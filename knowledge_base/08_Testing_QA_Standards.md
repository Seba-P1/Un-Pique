# Testing and QA Standards

## 1. The Testing Pyramid
- **Base (Unit Tests):** The vast majority of our tests. Test isolated utility functions, custom hooks, and isolated pure components using tools like Jest or Vitest. Execution should be under seconds.
- **Middle (Integration Tests):** Connecting multiple components or checking API endpoints interacting with a mock or test database.
- **Top (E2E Tests):** Simulate real users interacting with the full application stack using Playwright or Cypress. These run slowly but verify critical business flows (e.g., Sign up, Add to cart, Checkout).

## 2. Test-Driven Development (TDD) Mindset
- **Red, Green, Refactor:** Whenever possible, write a failing test first outlining the requirement, write minimal code to pass it, then refactor for code quality.
- **Testing Behavior, Not Implementation:** Avoid testing exactly *how* a component is built (e.g., checking if a specific `div` has a class). Test *what it does* (e.g., checking if a button with text "Submit" triggers a specific callback). Use Testing Library methodologies.

## 3. Automated Setup
- **Continuous Execution:** Run Unit and Integration tests on pre-commit hooks (Husky) and CI pipelines to prevent broken code from being merged.
- **Test Data Management:** Utilize factories or seeding scripts to cleanly populate test databases. Avoid relying on hardcoded standard production data that may change.
- **Clean State:** Every test must start from a completely clean state. Never share state between tests to prevent cascading failures.

## 4. UX and Visual Regression Testing
- **Visual Checks:** For premium aesthetic apps, employ visual regression testing tools (Percy, Chromatic) mapped to Playwright or Storybook to auto-detect unintended CSS bleed or layout shifts.
- **Accessibility Checks:** Use `axe-core` in CI/CD to block deployments that introduce accessibility violations (poor contrast, missing ARIA tags).

## 5. Testing with AI (TestSprite / NotebookLM Assisted)
- **Advanced QA Agents:** Tools like TestSprite MCP can automatically generate test plans by reading requirements. They autonomously execute the code, look for edge cases, and report logs in the IDE.
- **Prompted Test Generation:** Leverage AI correctly by supplying the function's strict requirements and asking it to specifically produce boundary edge-cases, malicious input strings, and null handling tests, ensuring robust test suites.
