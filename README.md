<h1 align="center">
  <br>
   <img src="https://user-images.githubusercontent.com/62745858/229376399-edede393-f1e7-4e91-8c68-d76510ece76f.png" width="100"><br>
   React Native Chat App
   <br>
   <br>
   <img src="https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
   <img src="https://img.shields.io/badge/supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
   <img src="https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37" />
</h1>

<div align="center">
  <a href="https://github.com/Ctere1/react-native-chat/stargazers">
    <img src="https://img.shields.io/github/stars/Ctere1/react-native-chat?style=social" alt="GitHub Repo stars">
  </a>
  <a href="https://github.com/Ctere1/react-native-chat/network/members">
    <img src="https://img.shields.io/github/forks/Ctere1/react-native-chat?style=social" alt="GitHub forks">
  </a>
  <a href="https://github.com/Ctere1/react-native-chat/watchers">
    <img src="https://img.shields.io/github/watchers/Ctere1/react-native-chat?style=social" alt="GitHub watchers">
  </a>
  <br>
</div>

<p align="center">
  <a href="#ℹ️-introduction">Introduction</a> •
  <a href="#features">Features</a> •
  <a href="#installation-guide">Installation Guide</a> •
  <a href="#🏗️building-guide">Building Guide</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a> •
  <a href="#contributors">Contributors</a> 
</p>

---

## ℹ️ Introduction

**React Native Chat App** is a real-time chat application built using [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/), powered by [Supabase](https://supabase.com/) for authentication, PostgreSQL-backed realtime messaging, and storage.

- For the live demo video see [Demo.mp4](./media/ReactNativeChat-Live-Demo.mp4)     

https://github.com/Ctere1/react-native-chat/assets/62745858/bcde4aa0-d2f2-4d8c-8716-bf274c059d2e

> [!NOTE] 
> See screenshots below for a preview.

---

## ⚡ Features

| Feature             | Description                                                                                           |
| :------------------ | :---------------------------------------------------------------------------------------------------- |
| **Signup and Login**  | Supabase Email/Password sign-in method. Allow users to sign up using their email address and password |
| **Send Text Message** | Essential for casual messaging                                                                        |
| **Send Picture**      | You can send pictures without losing quality                                                          |
| **Group Chat**        | You can send your messages to multiple people at the same time                                        |
| **Delete Chat**       | Hold and select chats to delete them                                                                  |
| **Delete Account**    | Delete your account from settings                                                                     |
| **Real Time Chat**    | Chats update instantly with new messages                                                              |
| **Users List**        | Registered users sorted alphabetically                                                                |
| **Note to Self**      | Create personal notes by messaging yourself                                                           |

---

## 💾 Installation Guide

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (with [npm](http://npmjs.com)).

```bash
# Clone this repository
git clone https://github.com/Ctere1/react-native-chat
cd react-native-chat

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

> [!TIP] 
> Install [Expo Go](https://expo.dev/go) on your mobile device to test the app instantly.

> [!WARNING]  
> Don't forget to set up your `.env` file for Supabase connection using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## 🏗️ Building Guide

To build this application for production (e.g., APK for Android):

1. **Set up environment variables:**  
   Create a `.env` file with your Supabase config. Push it to EAS environment:

   ```bash
   eas secret:push --scope project --env-file .env
   ```

2. **Build the APK (Android):**

   ```bash
   eas build -p android --profile preview
   ```

   This will use the preview profile in [eas.json](/eas.json).

> [!NOTE]   
> Environment variables in `.env` are used by Expo CLI locally.  
> For EAS Build, define variables in your `eas.json` build profile for best results.

> **Local Build:**
>
> ```bash
> # For android
> npm run android
>
> # For ios
> npm run ios
> ```

---

## 🪟 Screenshots

### **Login & Signup**
| Login | Signup |
| :---: | :----: |
| <img src="./media/ss1.jpg"  width="250"> | <img src="./media/ss2.jpg"  width="250"> |

### **Chats & Users**
| Chats | Users | Group Chat | Delete Chats |
| :---: | :---: | :--------: | :----------: |
| <img src="./media/ss3.jpg"  width="250"> | <img src="./media/ss4.jpg"  width="250"> | <img src="./media/ss5.jpg"  width="250"> | <img src="./media/ss7.jpg"  width="250"> |

### **Settings & More**
| Settings | Profile | Help | Account |
| :------: | :-----: | :--: | :-----: |
| <img src="./media/ss8.jpg"  width="250"> | <img src="./media/ss9.jpg"  width="250"> | <img src="./media/ss10.jpg"  width="250"> | <img src="./media/ss11.jpg"  width="250"> |

### **Chat Experience**
| Emoji Panel | Note to Self | Main Chat Screen | Chat Info |
| :---------: | :----------: | :--------------: | :-------: |
| <img src="./media/ss12.jpg"  width="250"> | <img src="./media/ss13.jpg"  width="250"> | <img src="./media/ss14.jpg"  width="250"> | <img src="./media/ss15.jpg"  width="250"> |

###  **Other**
| Message Indicator |
| :--------------: |
| <img src="./media/ss16.jpg"  width="250"> |

---

## 📝 Credits

This software uses the following packages:

- [Expo](https://expo.dev/)
- [React](https://react.dev/)
- [React Native](https://reactnative.dev/)
- [Supabase](https://supabase.com/)
- [react-native-gifted-chat](https://github.com/FaridSafi/react-native-gifted-chat)
- [react-native-emoji-modal](https://github.com/staltz/react-native-emoji-modal)

---

## © License
![GitHub](https://img.shields.io/github/license/Ctere1/react-native-chat)

---

## 📈 Star History

<a href="https://app.repohistory.com/star-history?repo=Ctere1/react-native-chat">
  <img src="https://app.repohistory.com/api/svg?repo=Ctere1/react-native-chat&type=Date&background=0D1117&color=6278f8" alt="Star History Chart">
</a>

---

## 📌 Contributors

![Repobeats analytics image](https://repobeats.axiom.co/api/embed/0d9c40f20e57bc518a7e1419e18f6b6cfa57873d.svg)

<a href="https://github.com/Ctere1/react-native-chat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Ctere1/react-native-chat" alt="Contributors">
</a>

