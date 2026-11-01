# FitApp - Diplomamunka

Mobil fitnesz és aktivitáskövető alkalmazás, ami React Native és Firebase alapon készült. Lépésszámlálást, edzésterveket, edzésnaplózást, kalóriabevitelt és személyes rekordokat kezel.

## Gyors indítás

Szükséges eszközök: Node.js és a telefonon az Expo Go app.

1. Lépj be a mobile mappába és telepítsd a csomagokat:
```bash
cd mobile
npm install
```

2. Indítsd el a fejlesztői szervert:
```bash
npx expo start --go
```

3. Olvasd be a terminálban megjelenő QR kódot az Expo Go appal, és az alkalmazás elindul a telefonon.

## Önálló APK telepítés

Ha nem szeretnéd forráskódból futtatni, a kész Android alkalmazás elérhető a GitHub Releases fül alatt app-release.apk néven. Ezt csak le kell tölteni a telefonra és feltelepíteni.

## Használt technológiák

- Frontend: React Native, Expo, TypeScript
- Navigáció: React Navigation
- Backend és adatbázis: Firebase Authentication és Cloud Firestore
- Szenzorok: Expo Sensors lépésszámlálóhoz
- Grafika: React Native SVG diagramokhoz
- Build eszköz: Android Gradle wrapper

## Főbb modulok és funkciók

- Főoldal: napi lépésszám, kalóriabevitel, vízbevitel és edzések áttekintése.
- Edzés modul: sablonok és egyéni edzéstervek készítése, aktív edzés közbeni széria és ismétlés rögzítés, pihenőidő időzítő.
- Lépésszámláló: a telefon beépített lépésszenzorát használja a napi aktivitás és a megtett távolság mérésére.
- Étrend és folyadék: ételek kalóriaértékének gyors rögzítése, valamint napi vízbevitel követése.
- Rekordok: egyéni csúcsok nyilvántartása és egyismétléses maximum becslés.

## Projekt felépítése

```text
mobile/
  assets/           képek és ikonok
  android/          natív Android projekt és Gradle beállítások
  src/
    components/     felületi elemek és modális ablakok
    hooks/          adatkezelő hookok a felület és a Firestore között
    screens/        fő képernyők
    services/       Firebase hívások, lépésszámláló és számítások
    themes/         színek és stílus konstansok
```

## APK készítése forráskódból

Ha saját gépen szeretnéd újra lefordítani az Android telepítőfájlt:

```bash
cd mobile/android
.\gradlew assembleRelease
```

A kész fájl itt jön létre:
mobile/android/app/build/outputs/apk/release/app-release.apk
