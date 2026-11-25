# FitTrack - Szakdolgozati Rendszertesztek és Minőségbiztosítási Napló

Ez a dokumentum a szakdolgozatom 4. és 5. fejezetéhez kapcsolódó gyakorlati ellenőrzéseket, teszteredményeket és javításokat foglalja össze. A célom az volt, hogy a fejlesztés során ne csak kézzel nyomkodjam végig a felületet, hanem automatizált egységtesztekkel és szisztematikus ellenőrzésekkel támasszam alá: a számítási modulok pontosak, a képernyők reszponzívak, a felhőbe való mentés stabil, és az adatbázis védelme is zár.

---

## 1. Számítási logikák és automatizált egységtesztek (Jest)

Az alkalmazás legfontosabb biometriai és edzéselméleti számításait tiszta, determinisztikus függvényekbe szerveztem, hogy hardver- és felületfüggetlenül lehessen őket tesztelni. 

A tesztek futtatása a projekt gyökeréből:
```bash
cd mobile
npm test
```

### Az ellenőrzött képletek és funkciók:

1. **Mifflin-St Jeor BMR (alapanyagcsere) képlet:**
   - Férfiaknál: `10 * súly + 6.25 * magasság - 5 * életkor + 5`
   - Nőknél: `10 * súly + 6.25 * magasság - 5 * életkor - 161`

2. **TDEE (napi teljes energiafelhasználás) és célkalória:**
   - `TDEE = BMR * aktivitási szorzó` (ülőmunkától az extra aktivitásig: 1.2 – 1.9)
   - Cél szerinti finomhangolás: fogyásnál -500 kcal deficit, tömegnövelésnél +350 kcal többlet, súlytartásnál változatlan.

3. **Makrotápanyag megoszlás:**
   - Fehérje: 2 g / testsúly-kg
   - Zsír: 0.9 g / testsúly-kg
   - Szénhidrát: a fennmaradó kalória (illetve ketogén étrend esetén alacsony szénhidrát és magasabb zsír).

4. **Epley 1RM becslés és erőintenzitási zónák:**
   - `1RM = Súly * (1 + Ismétlés / 30)` (1 ismétlésnél a képlet nem torzít: `1RM = Súly`)
   - 60% – 100% közötti intenzitási zónák súly- és ismétlésbecslése.

5. **Lépésszámláló és aktivitás becslések:**
   - Megtett távolság: `(Lépések * 0.75) / 1000` km (0.75 m átlagos lépéshosszal)
   - Elégetett kalória: `Lépések * 0.04` kcal
   - Aktív gyaloglási idő: `Lépések / 100` perc (átlagos 100 lépés / perc tempóval)

---

## 1.1 A tesztelés során felmerült kezdeti problémák és javításuk (10 teszteset)

A funkciók implementálása és a kezdeti tesztek futtatása során több olyan számítási pontatlanságba, elírásba és határérték-kezelési hibába futottam bele, amiket refaktorálással javítottam:

- **TC-01: BMR női konstans**
  - *Kezdeti hiba:* 1496 kcal lett a várt 1330 kcal helyett.
  - *Ok:* Nem volt külön nemi logika lekezelve, mindenkinél a férfi `+5` konstanssal számolt a női `-161` helyett.
  - *Javítás:* Beépítettem a feltételes nemi korrekciót (`const genderAdjustment = isFemale ? -161 : 5;`). Állapot: PASS.

- **TC-02: BMR zéró és hiányzó értékek kezelése**
  - *Kezdeti hiba:* `NaN` vagy negatív szám jött ki.
  - *Ok:* 0 kg súly vagy 0 cm magasság esetén a képlet érvénytelen negatív értéket adott, amitől lefagyott a felület.
  - *Javítás:* Bemeneti védelmet adtam a függvény elejére: hibás adatok esetén biztonságos alapértékkel (1650 kcal) tér vissza. Állapot: PASS.

- **TC-03: TDEE aktivitási szintek és ékezetek**
  - *Kezdeti hiba:* 2790 kcal lett a várt 2160 kcal helyett.
  - *Ok:* Az aktivitási szintek szövegként érkeznek, a `switch-case` a kis- és nagybetűk, illetve az ékezetek miatt a default 1.55-ös szorzóra ugrott 1.2 helyett.
  - *Javítás:* Felvettem az alternatív ágakat (`case 'sedentary': case 'Ülőmunka': multiplier = 1.2;`). Állapot: PASS.

- **TC-04: Kalóriadeficit alsó korlátja**
  - *Kezdeti hiba:* Veszélyesen alacsony, 940 kcal-os keret jött ki.
  - *Ok:* Alacsony testsúlyú felhasználónál a fix -500 kcal deficit az egészségügyileg minimális 1200 kcal alá vitte a napi keretet.
  - *Javítás:* Kényszerítettem a biztonsági alsó korlátot (`targetCalories = Math.max(1200, tdee - 500);`). Állapot: PASS.

- **TC-05: Tömegnövelési többlet finomhangolása**
  - *Kezdeti hiba:* +500 kcal túl agresszív többletet számolt.
  - *Ok:* Tömegnövelésnél korábban fix +500 kcal-t adott hozzá a kód, ami tiszta izomépítés helyett felesleges zsírosodást okozna.
  - *Javítás:* Finomhangoltam a dolgozat 4. fejezetében leírt tiszta tömegnövelési értékre (`targetCalories = tdee + 350;`). Állapot: PASS.

- **TC-06: Epley 1RM 1 ismétléses anomália**
  - *Kezdeti hiba:* 100 kg x 1 ismétlésnél 103 kg jött ki.
  - *Ok:* A nyers Epley formula 1 ismétlésre is rászámolt: 100 * 1.033 = 103 kg a valós 100 kg helyett.
  - *Javítás:* Külön ágat vezettem be 1 ismétlésre: ha az ismétlésszám 1, pontosan a kinyomott súly az 1RM. Állapot: PASS.

- **TC-07: Epley negatív és zéró súly**
  - *Kezdeti hiba:* `NaN` vagy negatív 1RM érték.
  - *Ok:* Üres mező vagy negatív szám bevitelekor érvénytelen kimenetet adott a kalkuláció.
  - *Javítás:* Bemeneti határokat rögzítettem (`Math.max(0, weight)` és `Math.max(1, reps)`). Állapot: PASS.

- **TC-08: BMI mértékegység elcsúszás**
  - *Kezdeti hiba:* BMI = 0.00228 lett a várt 22.9 helyett.
  - *Ok:* A magasság centiméterben érkezett (175 cm), de a BMI képlet métert vár a négyzethez (70 / 175^2 = 0.00228).
  - *Javítás:* Beépítettem a mértékegység-átváltást méterre a számítás előtt. Állapot: PASS.

- **TC-09: Lépésszámláló és szenzorkommunikáció**
  - *Kezdeti hiba:* Elakadás vagy kezeletlen kivétel tesztkörnyezetben.
  - *Ok:* Az első tesztelés nem működött, mivel a sensor kommunikáció nem ment megfelelően: a natív hardveres szenzor tesztkörnyezetben vagy emulátoron hibát dobott a natív híd hiánya miatt.
  - *Javítás:* A domén kalkulációs logikát leválasztottam tiszta, hardverfüggetlen függvényekbe, a szenzorhívást pedig try-catch védelemmel és fallback értékkel láttam el. Állapot: PASS.

- **TC-10: Lépéskalkuláció határértékei**
  - *Kezdeti hiba:* Negatív kilométer és kalória értékek jelentek meg.
  - *Ok:* Zéró vagy negatív lépésszám bevitelekor érvénytelen negatív távolságot adott a nyers képlet.
  - *Javítás:* Bemeneti guard került a számítások elejére (`const safeSteps = Math.max(0, steps || 0);`). Állapot: PASS.

---

## 2. Képernyők és felületek tesztelése (390px képernyőszélesség)

Mivel rengeteg különböző kijelzőméret létezik, az alkalmazás összes képernyőjét és modális ablakát végignéztem egy tipikus, 390px széles nézeten (iPhone 12/13/14 és szabványos Android telefonok mérete), hogy ellenőrizzem: elférnek-e a gombok, és nincs-e vízszintes túlcsordulás.

### Képernyők (11 db tiszta Stack útvonal):

- **LoginScreen (`Login`):** Bejelentkezés és jelszó-visszaállítás. Letisztult felület, a felesleges közösségi gombok eltávolítva. Eredmény: Megfelelt.
- **RegisterScreen (`Register`):** Új fiók regisztrációja. Reszponzív űrlap, a felugró billentyűzet nem takarja ki a mezőket. Eredmény: Megfelelt.
- **MenuScreen (`Menu`):** Főmenü, gyorsfunkciók és napi statisztikák. A kártyák és a diagramok szépen elférnek. Eredmény: Megfelelt.
- **ProfilScreen (`Profil`):** Személyes adatok, BMI, BMR/TDEE mutatók. A 3 oszlopos biometriai kártyarács pontosan kifér. Eredmény: Megfelelt.
- **EditProfileScreen (`EditProfile`):** Biometrikus profil módosítása. A Firestore mentés és visszaolvasás azonnal frissül. Eredmény: Megfelelt.
- **StatScreen (`Stats`):** Heti edzés- és kalóriadiagramok. Az oszlopdiagramok dinamikusan skálázódnak 390px-en is. Eredmény: Megfelelt.
- **ExerciseScreen (`Exercise`):** Edzéstervek és gyakorlattár. A kártyák és kategória szűrők megfelelően törnek. Eredmény: Megfelelt.
- **DietScreen (`Diet`):** Napi étkezések és kalóriaszámláló. Törlés gombbal kiegészítve, nem csúszik ki a sorból. Eredmény: Megfelelt.
- **PersonalStatsScreen (`PersonalStats`):** Egyéni csúcsok (PR) és 1RM kalkulátor. A százalékos intenzitási zónák dinamikusan listázódnak. Eredmény: Megfelelt.
- **StepCounterScreen (`StepCounter`):** Napi és heti lépéselemzés. Az óránkénti és a heti grafikon is reszponzív. Eredmény: Megfelelt.
- **WorkoutProgressScreen (`WorkoutProgress`):** Befejezett edzések naplója és heti volumen statisztika. Jól olvasható kártyák. Eredmény: Megfelelt.

### Modális ablakok (8 db):

- **ActiveWorkoutModal (`ActiveWorkoutModal.tsx`):** Aktív edzés rögzítése sorozatonként. Korábban lelógtak a pipa és törlés gombok; a paddingok csökkentésével és `minWidth: 0` beállításával most már stabilan láthatóak. Eredmény: Javítva.
- **QuickMealModal (`QuickMealModal.tsx`):** Gyors étkezés hozzáadása a főmenüből. 3500 kcal-os felső limit validációval védve. Eredmény: Megfelelt.
- **QuickWaterModal (`QuickWaterModal.tsx`):** Vízfogyasztás rögzítése (+250, +500 ml). A gombok és számlálók reszponzívak. Eredmény: Megfelelt.
- **QuickWorkoutModal (`QuickWorkoutModal.tsx`):** Gyors edzésindítás tervválasztással. A lista és a gombok jól illeszkednek. Eredmény: Megfelelt.
- **ExercisePickerModal (`ExercisePickerModal.tsx`):** Gyakorlat kiválasztása edzés közben. A keresőmező és lista reszponzív. Eredmény: Megfelelt.
- **CreateExerciseModal (`ExerciseScreen.tsx`):** Egyéni gyakorlat felvétele. Az izomcsoport és típus választók jól törnek több sorba. Eredmény: Megfelelt.
- **EditPrModal (`PersonalStatsScreen.tsx`):** Egyéni rekord rögzítése és módosítása. A súly és ismétlés mezők megfelelően elférnek. Eredmény: Megfelelt.
- **ForgotPasswordModal (`LoginScreen.tsx`):** Jelszó-visszaállítási kérelem beküldése e-mailben. Letisztult felület. Eredmény: Megfelelt.

---

## 3. Valós adatok és Firebase szinkronizáció

Fontos szempont volt, hogy a bemutatott alkalmazás ne beégetett mintákkal vagy memóriabeli kamu adatokkal fusson, hanem minden funkciója valós felhőalapú perzisztenciával rendelkezzen a Google Firebase Firestore adatbázisban:

- **Felhasználói profil (`users/{uid}`):** Valós biometrikus profil (életkor, nem, cél, magasság, súly) olvasása és frissítése.
- **Étrend és kalóriák (`meals/{mealId}`):** Valós dokumentumok, az étkezések létrehozhatók, listázhatók és törölhetők.
- **Edzésnapló (`workoutSessions/{id}`):** Befejezett edzések sorozatai, súlyai és ideje perzisztens módon mentődnek.
- **Egyéni rekordok (`personalRecords/{uid_exId}`):** Az új csúcsok automatikusan frissülnek az edzés rögzítésekor.
- **Vízfogyasztás (`waterDrank/{id}`):** Napi folyadékbevitel dátum szerint mentve és összegezve.
- **Lépések (`dailySteps/{uid_date}`):** Napi lépésszámok mentése idempotens módon a felhőbe.

---

## 4. Firestore biztonsági szabályok (`firestore.rules`)

A dolgozatban leírt biztonsági követelményeknek megfelelően a szabályok biztosítják a felhasználói adatok szigorú védelmét és az értékek validációját:

- **Hitelesítés kényszerítése:** Csak bejelentkezett felhasználó érheti el az adatbázist (`request.auth != null`).
- **Saját adatok védelme:** Senki nem olvashatja vagy módosíthatja más felhasználó adatait (`resource.data.userId == request.auth.uid`).
- **Mezőszintű érték-validáció:**
  - Étkezéseknél (`meals`): a kalória pozitív szám kell legyen (`calories > 0`), nulla vagy negatív kalóriájú étel nem menthető.
  - Vízfogyasztásnál (`waterDrank`): az elfogyasztott mennyiség pozitív kell legyen (`amountMl > 0`).
  - Lépéseknél (`dailySteps`): a rögzített lépésszám nem lehet negatív (`steps >= 0`).
- **Hibaállapot megelőzése:** Az `allow read` kifejezésekben soha nem szerepel a `request.resource`, így nem léphet fel null-pointer hiba olvasáskor.

---

## 5. A fejlesztés és tesztelés során feltárt hibák javítása (Bug Log)

A tesztelések és a manuális ellenőrzések során az alábbi problémákat tártam fel és javítottam:

- **BUG-01: Gombok lelógása aktív edzés közben (`ActiveWorkoutModal.tsx`)**
  - *Probléma:* Súlyzós edzés rögzítése során 390px képernyőn a pipa és a törlés gomb lecsúszott a képernyőről.
  - *Megoldás:* Flexbox oszlopszélességek újrahangolása, paddingok csökkentése és `minWidth: 0` bevezetése az input mezőkre.

- **BUG-02: Beégetett célérték a felhasználó adatai helyett (`userService.ts`, `DietScreen.tsx`)**
  - *Probléma:* Mindenkinél fix 2200 kcal szerepelt célértékként, függetlenül a felhasználó adataitól.
  - *Megoldás:* A Mifflin-St Jeor képlet és a TDEE szorzó bekötése; makró grammok dinamikus számítása a kor, nem, súly és edzéscél alapján.

- **BUG-03: Hiányzó étkezéstörlés funkció (`dietService.ts`, `DietScreen.tsx`)**
  - *Probléma:* Nem lehetett kitörölni a tévesen felvitt étkezéseket a napi naplóból.
  - *Megoldás:* `deleteMealData` függvény megvalósítása `deleteDoc` hívással, megerősítő felugró ablakkal és törlés ikonnal.

- **BUG-04: Nem működő közösségi bejelentkezési gombok (`LoginScreen.tsx`, `RegisterScreen.tsx`)**
  - *Probléma:* A felületen "Hamarosan elérhető" dummy gombok voltak, amik rontották a felhasználói élményt.
  - *Megoldás:* A placeholderek kivezetése; helyette tiszta, professzionális Firebase e-mail/jelszó hitelesítés működik.

- **BUG-05: Nem kívánt visszalépés Login képernyőre (`LoginScreen.tsx`, `useMenuData.ts`)**
  - *Probléma:* Sikeres bejelentkezés után a telefon hardveres Vissza gombjával vissza lehetett lépni a belépő felületre.
  - *Megoldás:* A navigációs veremtár ürítése belépéskor a `navigation.reset` hívás segítségével.

- **BUG-06: Statikus 1RM formula (`prService.ts`, `workoutService.ts`)**
  - *Probléma:* Az 1RM képlet csak statikus helyőrzőként szerepelt, nem volt bekötve az edzésmentésbe.
  - *Megoldás:* Epley képlet központi integrálása; edzésnaplózáskor automatikusan frissülő `estimated1Rm` és `totalVolumeKg` Firestore rekordok generálása.

- **BUG-07: Beégetett tesztrekordok és elírás a dashboardon (`prService.ts`, `DashboardStats.tsx`, `App.tsx`)**
  - *Probléma:* Új regisztrációknál is megjelent a beégetett guggolás, fekvenyomás és felhúzás csúcs; a dashboardon "Elfogasztott kalória" elírás szerepelt; az `App.tsx`-ben pedig használaton kívüli `HomeScreen` és duplikált útvonalak maradtak.
  - *Megoldás:* `DEFAULT_PRS` kiürítése üres objektumra (`{}`), így az új fiókok tiszta állapotból indulnak; elírás javítása "Elfogyasztott kalória" szövegre; árva képernyő és kisbetűs duplikált útvonalak eltávolítása.
