# UI Animations and Motion Standards

## 1. Purpose of Motion
- **Contextual Awareness:** Use animations to guide the user's attention, such as showing where an item flew when added to a cart or expanding a modal from its source button.
- **Feedback:** Provide immediate physical feedback for digital actions. A button should depress visually when clicked, and a failed form should subtly shake.
- **Perceived Performance:** Distract the user during load times. A well-designed skeleton loader or branded spinner makes wait times feel shorter than static loading screens.

## 2. Timing and Easing (Physics of Motion)
- **Easing Defaults:** Never use linear animations unless tracking real-time data progress. Use `ease-out` for objects entering the screen (decelerating) and `ease-in` for objects leaving (accelerating).
- **Duration Guidelines:**
  - Micro-interactions (hover, toggle): 100ms - 200ms
  - Small movements (menus, tooltips): 200ms - 300ms
  - Large transitions (page loads, modals): 300ms - 500ms
- **Avoid Over-Animation:** If an animation takes longer than 500ms, it is likely too slow and will frustrate power users.

## 3. Implementation Tools
- **CSS Transitions:** Prefer CSS `transition` and `transform` for simple state changes (hover, active, focus). CSS animations on `opacity` and `transform` are hardware-accelerated.
- **React Native / Expo:** Use React Native Reanimated (v3+) for extremely performant, non-blocking 60fps animations running on the UI thread.
- **Complex Orchestrations:** Use libraries like Framer Motion for web or Lottie for importing complex vector animations (e.g., success checkmarks) created in After Effects.

## 4. Accessibility
- **Respect User Preferences:** Always check for `prefers-reduced-motion`. If enabled by the user's OS, disable all non-essential decorative animations and replace structural animations with instant transitions or simple cross-fades.

## 5. Choreography
- **Staggering:** When loading lists or grids of items, stagger their entrance animations slightly (e.g., 50ms delay per item) rather than animating them all simultaneously. This creates a more organic, premium feel.
