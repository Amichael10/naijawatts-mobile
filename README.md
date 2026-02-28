# ⚡ NaijaWatts

**Smart Utility Bill Splitting for Modern Compounds.**

NaijaWatts is a specialized bill-splitting application designed to help neighbors and housemates in Nigeria (and beyond) fairly divide utility costs. Whether it's electricity, water, or shared diesel, NaijaWatts makes the math simple and transparent.

---

## ✨ Key Features

- ⚡ **Smart Split**: Intelligent calculations that account for different flat sizes, tenant counts, or usage levels.
- 👥 **Compound Management**: Add and manage multiple properties or "compounds" with different sets of tenants.
- 📱 **WhatsApp Integration**: Export your split results directly to your compound's WhatsApp group with a beautifully formatted message.
- 🌘 **Modern Dark Mode**: A premium, high-contrast interface designed for low-light environments (perfect for those NEPA moments).
- 🔄 **History Tracking**: Keep a record of past bill cycles for every compound.
- 📊 **Visual Comparisons**: Interactive color-coded bars to see exactly who's paying what at a glance.

---

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Storage**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for local data persistence.
- **Icons**: [Feather Icons](https://feathericons.com/) via `@expo/vector-icons`.
- **UI/UX**: Custom-built design system with dynamic theming.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/expo-go) app on your physical device for testing.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Amichael10/naijawatts-mobile.git
    cd naijawatts-mobile
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npx expo start
    ```

Scan the QR code with your Expo Go app (Android) or Camera app (iOS) to see the app in action!

---

## 🏗️ Building for Production

To build a standalone APK or IPA using EAS (Expo Application Services):

```bash
# Install EAS CLI globally if you haven't already
npm install -g eas-cli

# Login to your Expo account
eas login

# Build for Android (APK)
eas build -p android --profile preview
```

---

## 🔧 Troubleshooting Common Build Issues

### 1. `spawn adb ENOENT` (on Windows)
This error occurs when the `adb` command (Android Debug Bridge) is not in your system's `PATH`.
- **Fix**: Ensure the Android SDK is installed and add the `platform-tools` folder to your environment variables.
- **Path Example**: `C:\Users\YourUser\AppData\Local\Android\Sdk\platform-tools`

### 2. Gradle Distribution Timeout (`services.gradle.org`)
Sometimes the Gradle distribution download fails due to network timeouts.
- **Fix**: Try the build again in a few minutes, or use a VPN if your local network is throttling connections to Gradle's servers.

---

## 📄 License

This project is private and for internal use only.

---

*Built with ❤️ for the Naija tech ecosystem.*
