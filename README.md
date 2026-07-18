# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Hướng dẫn chạy dự án React Native (Expo) - Nhân's Document
1. Chạy dự án

a. Chạy backend ==> cd backend ==> npm start

b. Chạy React Native (Frontend)
Lưu ý: Nhớ di chuyển vào đúng thư mục dự án trước khi chạy lệnh
==> cd "App_student_management" ==> npx expo start

2. Test trên điện thoại thật bằng Expo Go

    Bước 1: Cài đặt ứng dụng Expo Go trên điện thoại.

        ⚠️ Lưu ý: Phải cài đúng phiên bản. Bạn có thể tải file APK trực tiếp tại trang web: https://expo.dev/go.

    Bước 2: Quét mã QR xuất hiện trên terminal sau khi chạy lệnh: npx expo start
3. Test trên trình duyệt web
npm run web
4. Test trên máy ảo Android (Android Studio Emulator)
npm run android

# chỉnh ẩn hiện icon đường dẫn footer trong file _layout.tsx
options={{href: null,}} ==> để ẩn tab đó đi

# api.ts
Trong hàm getApiUrl dòng return cuối cùng:
// 🏭 App thật (release build) — không có Expo dev server
// ⚠️ Thay bằng IP/domain thật của server backend (phải có port :5000)
// kiểm tra bằng lệnh ipconfig và thấy IP WiFi hiện tại của bạn Ip cục wifi Của hưng => 'http://172.16.51.134:5000/api';
return 'http://192.168.1.100:5000/api';

==> Nên Chạy ipconfig trong cmd sẽ thấy IP WiFi hiện tại của bạn Ip cục wifi mà bạn đang kết nối...