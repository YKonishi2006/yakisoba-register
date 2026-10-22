// クラウド保存（Firebase）の設定。
// Firebase コンソール →「プロジェクトの設定」→「マイアプリ」→ ウェブアプリの「SDK の設定と構成」にある
// firebaseConfig の中身を、下の null と置き換えて貼り付ける。
//   例) export const FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", ... };
// この値は公開されても問題ない（アクセスは firestore.rules とログインで守る）。
// null のままなら、クラウドを使わず端末の中だけに保存する。
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCEJ6_8gAa1Xl6HWaAG6dsNKk3lOrS1f0Q",
  authDomain: "yakisoba-1222d.firebaseapp.com",
  projectId: "yakisoba-1222d",
  storageBucket: "yakisoba-1222d.firebasestorage.app",
  messagingSenderId: "166550214885",
  appId: "1:166550214885:web:8379a937537017272adc0c",
};

// 記録をまとめる店舗ID。別のお祭り用に記録を分けたいときだけ変える。
export const STORE_ID = "main";
