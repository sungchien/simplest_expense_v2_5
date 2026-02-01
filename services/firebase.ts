
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase 配置資訊
export const firebaseConfig = {
  "projectId": "studio-7641735948-cca72",
  "appId": "1:751579720155:web:2265428e72ede3133c5ffe",
  "apiKey": "AIzaSyDwP5-y4FhYaVzhZiTmL6rSbYxzbGoQqCo",
  "authDomain": "studio-7641735948-cca72.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "751579720155"
};

// 初始化 Firebase 應用實例
const app = initializeApp(firebaseConfig);

// 導出服務實例
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
