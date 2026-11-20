export const colors = {
    primary: "#0069FF",
    primaryDark: "#0052CC",
    primaryLight: "#EFF6FF",
    primaryBorder: "#BFDBFE",
    primaryBorderLight: "#DBEAFE",
    secondary: "#3AC786",

    // Status
    success: "#10B981",
    successDark: "#059669",
    successLight: "#DCFCE7",
    successText: "#15803D",
    warning: "#F59E0B",
    danger: "#EF4444",
    dangerLight: "#FEE2E2",

    // Accent
    sky: "#38BDF8",

    // Slate palette commonly used in screens
    slate: {
        50: "#F8FAFC",
        100: "#F1F5F9",
        200: "#E2E8F0",
        300: "#CBD5E1",
        400: "#94A3B8",
        500: "#64748B",
        600: "#475569",
        700: "#334155",
        800: "#1E293B",
        900: "#0F172A",
    },

    // Backward compatibility with existing screens
    neutral: {
        100: "#F5F5F5",
        200: "#E0E0E0",
        300: "#C2C2C2",
        400: "#9E9E9E",
        500: "#757575",
        600: "#5C5C5C",
        700: "#424242",
        800: "#2C2C2C",
        900: "#121212",
    },

    // Common surfaces and backgrounds
    background: "#F8FAFC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    white: "#FFFFFF",
    black: "#000000",

    // Semantic text colors
    text: "#121212",
    textPrimary: "#0F172A",
    textSecondary: "#334155",
    textMuted: "#64748B",
    textLight: "#94A3B8",

    // Borders
    border: "#E2E8F0",
    borderLight: "#F1F5F9",

    // Overlays
    overlay: "rgba(15, 23, 42, 0.5)",
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    "3xl": 32,
};

export const borderRadius = {
    xs: 6,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14,
    card: 16,
    header: 20,
    pill: 20,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    button: {
        shadowColor: "#0069FF",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    modal: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
};
