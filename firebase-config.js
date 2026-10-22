// クラウド保存（Firebase）の設定。
// Firebase コンソール →「プロジェクトの設定」→「マイアプリ」→ ウェブアプリの「SDK の設定と構成」にある
// firebaseConfig の中身を、下の null と置き換えて貼り付ける。
//   例) export const FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", ... };
// この値は公開されても問題ない（アクセスは firestore.rules とログインで守る）。
// null のままなら、クラウドを使わず端末の中だけに保存する。
export const FIREBASE_CONFIG = null;

// 記録をまとめる店舗ID。別のお祭り用に記録を分けたいときだけ変える。
export const STORE_ID = "main";
