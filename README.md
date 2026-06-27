# Pharma Order Book

An Android-first app for pharmaceutical distributors and medical reps to build a **Product Master** once and then create complete customer orders in under a minute by searching and tapping instead of retyping.

Built with **Expo (React Native) + TypeScript**, **expo-sqlite** for full offline storage, **react-native-paper** for Material Design 3, and an optional **Firebase** layer for auth + cloud sync.

> Why Expo instead of bare React Native? Every "technology" item you asked for (SQLite, PDF export, Excel export, WhatsApp/share sheet, biometric+PIN lock, dark mode) has a first-class, well-maintained Expo module. That means you (or whoever picks this up) can run it on a real Android phone in minutes via `npx expo start` + Expo Go, with no native Android Studio setup required for day-to-day development. It is still React Native — Expo is a framework on top of it — and you can eject to a bare workflow later if you need a native module that isn't covered here.

## What's implemented

| Feature | Status |
|---|---|
| Product Master (CRUD, categories, search) | ✅ |
| Customer Master (CRUD, search) | ✅ |
| Create Order (search-and-tap products, qty/free qty, remarks, unlimited lines, auto total) | ✅ |
| Order History (search by customer, filter by date, edit, delete, duplicate) | ✅ |
| Export: PDF, Excel, WhatsApp share, print-friendly | ✅ |
| Dashboard (today's orders, totals, recent orders) | ✅ |
| Fast search across products/customers/orders | ✅ |
| Offline-first SQLite storage | ✅ |
| Cloud sync scaffold (Firestore, last-write-wins) | ✅ (needs your Firebase config) |
| PIN + biometric app lock | ✅ |
| Backup / restore to a local JSON file | ✅ |
| Material Design 3 theme, light/dark mode | ✅ |
| Firebase Authentication (sign-in UI) | ⏳ scaffolded — see "Adding real Firebase Auth" below |
| Barcode scanner, voice input, AI suggestions, invoicing, multi-user, sales-rep tracking | 🔭 Future Features, intentionally out of scope for v1 (listed in the brief as "Future") |

## Project structure

```
PharmaOrderBook/
  App.tsx                 # Root: providers + navigation + lock screen gate
  src/
    types/                # Shared TS interfaces (Product, Customer, Order, OrderItem)
    database/             # SQLite: db.ts (schema/migrations), productRepo, customerRepo, orderRepo, kv.ts
    theme/                # MD3 light/dark theme, category colors
    context/               # ThemeContext (dark mode), AuthContext (PIN/biometric)
    navigation/            # Bottom tabs + per-section stacks
    screens/
      Dashboard/
      Products/            # List + Add/Edit form
      Customers/           # List + Add/Edit form
      Orders/              # History list, Create/Edit order, Order detail
      Settings/
      Auth/                # PIN setup / unlock screen
    components/            # SearchInput, ProductPickerModal, CustomerPickerModal, EmptyState
    services/              # pdfService, excelService, shareService, backupService, firebaseSync
```

## Running it

You'll need Node.js installed locally (this was built in a sandbox without network access, so dependencies haven't been installed or test-run here — do that on your machine):

```bash
cd PharmaOrderBook
npm install
npx expo start
```

Scan the QR code with **Expo Go** on an Android phone, or press `a` to launch an Android emulator if you have Android Studio set up.

To produce an installable `.apk`/`.aab` for distribution:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # quick APK for sharing
eas build -p android --profile production  # AAB for Play Store
```

## How the "under a minute" order flow works

1. Tap the **+ / New Order** button (Orders tab or Dashboard).
2. Tap **Select Customer** → search/tap (customer list is already in Customer Master).
3. Tap **Add Product** → search by name, company, or strength → tap to add. Repeat for as many products as needed.
4. Adjust **Qty** / **Free Qty** inline per line (numeric keypad).
5. Optional remarks, date defaults to today.
6. **Save Order** — total item count is calculated automatically.

From Order Detail you can export to PDF, export to Excel, share straight to WhatsApp, or print.

## Adding real Firebase (Authentication + Cloud Sync)

The app works **fully offline with zero Firebase setup**. To enable cloud sync and real login:

1. Create a project at https://console.firebase.google.com, enable **Authentication** (e.g. Email/Password or Phone) and **Cloud Firestore**.
2. Copy your web app config into `src/services/firebaseConfig.ts` (replace the `YOUR_...` placeholders).
3. Wire a real sign-in screen to `firebaseAuth` from that file (a simple email/password form using `signInWithEmailAndPassword` is enough to start) and pass the resulting `uid` into `syncNow(uid)` (see `src/services/firebaseSync.ts`), e.g. from a "Sync Now" tap in Settings or a background interval.
4. Firestore data is namespaced per user at `users/{uid}/products`, `users/{uid}/customers`, `users/{uid}/orders`, `users/{uid}/order_items`. Set Firestore security rules so a user can only read/write their own subtree.

Sync strategy: every local row has a `dirty` flag (1 = changed locally, needs push) and `updatedAt`. `syncNow()` pushes dirty rows, then pulls anything remotely newer than the last sync timestamp — last-write-wins, which is the right tradeoff for a single distributor's own order book.

## Notes on scope and assumptions

- **Categories** are exactly the 12 you listed, defined centrally in `src/types/index.ts` (`PRODUCT_CATEGORIES`) — add/remove there if your list changes.
- **Soft deletes**: deleting a product/customer/order sets `deleted=1` instead of removing the row, so the deletion can still sync to the cloud. Lists filter `deleted = 0` automatically.
- **Duplicate order**: copies all line items onto a new order dated today, then opens it in edit mode so you can tweak quantities before saving.
- **WhatsApp share** has two paths: (1) share the generated PDF/Excel file via the native share sheet (WhatsApp shows up there automatically if installed), and (2) a direct "send as WhatsApp text message" deep link with a formatted order summary.
- This was scaffolded in a sandboxed environment without internet access, so `npm install` has not been run or verified end-to-end here — please run it locally and report back if any dependency version needs bumping for your Expo SDK version.

## Suggested next steps (from your "Future Features" list)

Roughly in order of effort vs. value for a distributor's day-to-day use:
1. Customer-wise order history view (filter Order History by tapping a customer)
2. Monthly sales report (aggregate `orders`/`order_items` by month, export to Excel — most of the plumbing already exists in `excelService.ts`)
3. Barcode scanning to look up a product instantly (`expo-camera` + a barcode field on Product)
4. Inventory management (stock field + auto-decrement on order save)
5. Invoice/billing generation (extends the existing PDF service with pricing/tax)
6. Voice input for product search (`expo-speech-recognition` feeding into the existing search box)
7. Multi-user / sales-rep tracking (once real Firebase Auth is wired in, tag orders with the creating user's uid)
