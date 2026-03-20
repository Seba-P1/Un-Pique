# Platform-Specific Standards (Android, iOS, Windows)

## 1. iOS (Apple Ecosystem)
- **Human Interface Guidelines (HIG):** Comply strictly with Apple’s design paradigms. Use native-feeling components (bottom sheets, standard navigation bars).
- **Gestures:** iOS users rely heavily on swipe-to-go-back. Ensure custom navigation structures respect edge swipe gestures.
- **Safe Areas:** Handle notches and dynamic islands naturally. Ensure actionable content is fully unobstructed within the safe area insets.
- **Review Process Compliance:** Understand App Store rules regarding third-party payments and data collection (App Tracking Transparency).

## 2. Android (Google Ecosystem)
- **Material Design:** Adapt generic UI components to feel at home on Android incorporating Material Design 3 guidelines (e.g., prominent Floating Action Buttons, standard ripple haptics).
- **Hardware Back Button:** Manage the Android hardware back button and system back gestures rigorously to avoid unexpected app exits. Map it to "back" or "dismiss modal".
- **Fragmentation:** Test layout rendering thoroughly across varied aspect ratios (tall, foldable, standard) and lower-end CPU devices.
- **App Permissions:** Prompt for permissions (e.g., location, camera) contextually when the feature is accessed, not on startup. Include explanations.

## 3. Windows & Desktop Web
- **Keyboard & Mouse vs Touch:** While mobile prioritizes hit targets for thumbs (44x44pt min), desktop environments demand dense information, hover states, right-click context menus, and keyboard shortcuts (`Ctrl+S`, `Esc` to close modals).
- **Infinite Space:** Use horizontal space efficiently. Span layouts into sidebars or multi-column grids rather than expanding everything vertically to an absurd width.
- **Window Resizing:** Build responsive layouts that react intelligently to arbitrary user window-resizing (Container queries are ideal here).
- **OS Native Elements:** Acknowledge standard scrollbars and window controls, ensuring custom UI doesn't clash with operating system borders and behaviors.
