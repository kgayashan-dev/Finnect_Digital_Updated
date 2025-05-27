# 👋 Welcome to Your Expo App

This is an [Expo](https://expo.dev) project created using [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

---

## 🚀 Get Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the App
```bash
npx expo start
```

You’ll see options to open the app in:

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

> Start developing inside the **`app`** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction/).

---

## 📦 Get a Fresh Project

Reset the starter project with:

```bash
npm run reset-project
```

This will move the starter code to the `app-example` directory and create a blank `app` directory for your custom development.

---

## 📚 Learn More

Check out these resources:

- 📘 [Expo Documentation](https://docs.expo.dev/)
- 🚀 [Learn Expo Tutorial](https://docs.expo.dev/tutorial/introduction/)
- 💡 [Expo Guides](https://docs.expo.dev/guides)

---

## 👥 Join the Community

- [Expo GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)

---

## ⚙️ Local Build (Android Folder)

```bash
expo run:android --variant=release
cd android

# Build APK
./gradlew assembleRelease

# Build AAB
./gradlew bundleRelease

# Clean and build
./gradlew clean
./gradlew assembleRelease
```

---

## ⚙️ Local Build (Root Folder using EAS)

```bash
eas build --profile preview --platform android --local
eas build --profile preview --platform android --local --output=app.aab
```

---
## release build
eas build --profile production --platform android --local --output=app.aab
eas build -p android --profile production

## 🛠 Local Development Builds

```bash
eas build -p android --profile development
eas build -p ios --profile development
```

---

## 📦 Expo Cloud Builds

```bash
npm install -g eas-cli
eas login
eas build:configure

# Android Build
eas build -p android

# iOS Build
eas build -p ios
```

---

## 🌐 Expo Preview Builds

```bash
eas build -p android --profile preview
eas build -p ios --profile preview
```

-- version change
goto /android/app/build.gradle

<!-- 
 sudo npm install -g eas-cli

eas login

eas build:configure

eas build -p android --profile production



 -->