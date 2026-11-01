# 🏋️‍♂️ FitApp — Mobile Fitness & Activity Tracker

[![React Native](https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

An all-in-one mobile fitness application built with **React Native**, **Expo**, **TypeScript**, and **Firebase**. The application tracks daily physical activity (pedometer steps, calories, water intake), manages structured workout plans, logs live training sessions, tracks personal records (PRs), and manages dietary goals.

---

## 🇭🇺 Magyar nyelvű gyorsindítási útmutató (Témavezetői / Bírálói összefoglaló)

Ez a szakasz a konzulens és a bírálók számára nyújt gyors, lényegretörő útmutatót az alkalmazás forráskódból történő indításához, valamint az önálló `.apk` telepítéséhez.

### 1. Indítás forráskódból (3 egyszerű lépésben)

**Előfeltételek:** Telepített **Node.js (v18+)** és a telefonon az **Expo Go** alkalmazás (Google Play Áruházból vagy App Store-ból).

1. **Függőségek telepítése:**
   Nyiss egy terminált a letöltött/klónozott könyvtárban, és lépj be a `mobile/` mappába:
   ```bash
   cd mobile
   npm install
   ```

2. **Fejlesztői szerver elindítása:**
   - **Expo Go-val való futtatáshoz (ajánlott forráskódból való gyors teszteléshez):**
     ```bash
     npx expo start --go
     ```
     *(A `--go` kapcsoló garantálja, hogy az alkalmazás közvetlenül a telefonra telepített Expo Go klienssel induljon el.)*
   - **Egyéni fejlesztői builddel (Development Client):**
     ```bash
     npx expo start
     ```

3. **Futtatás a telefonon:**
   - A terminálban megjelenik egy nagy **QR-kód**.
   - Nyisd meg az **Expo Go** appot a telefonodon, és olvasd be a QR-kódot (Androidon az appon belül, iOS-en a Kamera alkalmazással).
   - Az alkalmazás azonnal lefordul és elindul a készüléken!

### 2. Önállóan telepíthető Android APK
Az alkalmazásból készült önálló, fizikai Android telefonra közvetlenül telepíthető `.apk` fájl, amely **nem igényel fejlesztői környezetet**.
- Az `.apk` fájl elérhető a repó [Releases](../../releases) fülén vagy a leadási csomag mellékleteként.
- Telefonra másolva / letöltve egyetlen érintéssel telepíthető.

### 3. Fő funkciók áttekintése
- **Interaktív Főmenü & Dashboard:** Lépésszámláló SVG kördiagram, kalóriabeviteli és hidratációs célok, gyorsnaplózás.
- **Edzéstervek & Élő Edzés:** Predefiniált és egyéni edzéstervek, pihenőidő-időzítő, sorozatonkénti pipálható súly/ismétlés naplózó.
- **Tápanyag- és Vízfogyasztás követés:** Gyorsadagos és egyedi folyadékbevitel, étkezések kalória- és makrotápanyag rögzítése.
- **Lépésszámláló modul:** Beépített hardveres gyorsulásmérő / lépésszenzor (`expo-sensors`), távolság- és kalóriabecslés, heti előzmények.
- **Egyéni csúcsok (PR) & Elemzések:** Fekvenyomás, guggolás, felhúzás 1RM becslés és rekordnapló.

---

## 🇬🇧 English Documentation

### Architecture & Key Design Patterns

The codebase follows modular, clean code principles:
- **Separation of Concerns:** Screens are lightweight orchestrators (e.g. [`MenuScreen.tsx`](mobile/src/screens/MenuScreen/MenuScreen.tsx) is ~140 lines). Complex state, permissions, and network operations are decoupled into custom React hooks (e.g. `useMenuData`, `useExerciseData`).
- **Domain-Driven Component Structure:** Reusable UI blocks and modals are isolated in their respective domain folders (`components/menu/`, `components/exercise/`).
- **Activity Data Source (Ports & Adapters):** Step tracking abstracts the physical device through an adapter pattern, supporting built-in phone hardware (`expo-sensors` Pedometer) with seamless fallback to simulated streams for consistent evaluation.
- **Security-First Backend:** User ownership is strictly enforced via Firestore Security Rules ([`firestore.rules`](firestore.rules)), disallowing unauthorized access across collections.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React Native](https://reactnative.dev/) (v0.86.3) with [Expo](https://expo.dev/) (SDK 57) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (strict mode) |
| **Navigation** | [React Navigation 7](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |
| **Backend & Cloud** | [Firebase Authentication](https://firebase.google.com/docs/auth) & [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| **Hardware / Sensors** | [`expo-sensors`](https://docs.expo.dev/versions/latest/sdk/sensors/) (Pedometer & Accelerometer) |
| **Vector Graphics** | [`react-native-svg`](https://github.com/software-mansion/react-native-svg) |
| **Build & Tooling** | `expo-dev-client`, Android Gradle Wrapper (`mobile/android`) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x recommended) — [Download](https://nodejs.org/)
- **npm** (comes bundled with Node.js) or **yarn**
- **Git** — [Download](https://git-scm.com/)
- *(Optional for physical device preview)*: **Expo Go** mobile app installed on your Android or iOS device.
- *(Optional for local Android builds)*: Android Studio with Android SDK and JDK 17+.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <REPO_URL>
   cd DiplomaMunka
   ```

2. **Install project dependencies:**
   ```bash
   cd mobile
   npm install
   ```

3. **Start the Expo Metro Bundler:**
   - **For Expo Go (standard mobile client):**
     ```bash
     npx expo start --go
     ```
   - **For Custom Development Build:**
     ```bash
     npx expo start
     ```

4. **Run the App:**
   - **Physical Device:** Scan the QR code displayed in the terminal using the **Expo Go** app (Android) or the native **Camera** app (iOS). Ensure your computer and phone are connected to the same Wi-Fi network.
   - **Android Emulator:** Press <kbd>a</kbd> in the terminal once an Android Virtual Device (AVD) is running.
   - **iOS Simulator (macOS only):** Press <kbd>i</kbd> in the terminal.

---

## 📦 Building Standalone Android APK

If you wish to produce a standalone `.apk` directly without Metro or Expo Go:

### Option A: Local Gradle Build
```bash
cd mobile/android
# On Windows PowerShell:
.\gradlew assembleRelease

# On macOS/Linux:
./gradlew assembleRelease
```
The generated APK will be placed at:
```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

### Option B: Cloud Build (Expo Application Services - EAS)
```bash
cd mobile
npm install -g eas-cli
npx eas build -p android --profile preview
```

---

## 📁 Project Directory Structure

```text
DiplomaMunka/
├── firestore.rules                   # Authoritative Firestore database security rules
├── README.md                         # Project documentation and startup guide
├── AGENTS.md                         # Engineering rules & build instructions
└── mobile/
    ├── package.json                  # Dependencies and execution scripts
    ├── app.json                      # Expo application manifest & permissions
    ├── tsconfig.json                 # TypeScript compiler configuration
    ├── firebaseConfig.ts             # Firebase client SDK initialization
    ├── assets/                       # App icons, splash screens, and image assets
    ├── android/                      # Native Android project (Gradle & native manifest)
    └── src/
        ├── components/
        │   ├── menu/                 # Dashboard cards, headers, quick action modals
        │   └── exercise/             # Workout plan cards, exercise pickers, modals
        ├── hooks/
        │   ├── useMenuData.ts        # Dashboard state, Firestore sync & refresh logic
        │   └── useExerciseData.ts    # Workout plans, custom exercises, CRUD operations
        ├── screens/
        │   ├── MenuScreen/           # Central dashboard & navigation hub
        │   ├── ExerciseScreen/       # Workout routines, plan manager, live session
        │   ├── DietScreen/           # Calorie logging, meals, nutritional breakdown
        │   ├── StepCounterScreen/    # Pedometer, cadence, weekly activity history
        │   ├── StatsScreen/          # Activity & hydration analytics
        │   ├── WorkoutProgressScreen/# Historical workouts, volume graphs
        │   ├── PersonalStatsScreen/  # 1RM calculators & Personal Records (PR)
        │   └── ProfileScreen/        # User profile, body metrics & account settings
        ├── services/
        │   ├── stepService.ts        # Hardware pedometer interface & metric calculations
        │   ├── waterService.ts       # Hydration tracking Firestore operations
        │   ├── dietService.ts        # Meal records & daily consumed calorie queries
        │   ├── workoutService.ts     # Predefined & custom workout plan management
        │   └── exerciseService.ts    # Exercise library & custom exercise CRUD
        └── themes/
            └── tokens.ts             # Global design tokens (color palette, spacing)
```

---

## 🔒 Security & Firestore Rules

All user-generated records (`users`, `meals`, `workoutSessions`, `workoutPlans`, `personalRecords`, `waterDrank`) are scoped to the authenticated user ID (`request.auth.uid`).

Rules are verified and deployed via [`firestore.rules`](firestore.rules). Users can only create, update, or read documents tagged with their own `userId`.

---

## 📄 License & Academic Integrity

This project has been developed as part of a **University Degree Thesis (Diplomamunka)**. All rights reserved. For evaluation and academic review purposes only.
