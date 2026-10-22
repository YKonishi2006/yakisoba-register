/* クラウド保存（Firebase Firestore）
   stores/{STORE_ID}        … 設定 {price, goal, cost, priceLog[]}
   stores/{STORE_ID}/tx/{id} … 取引1件ずつ（id は "A-12" のようにレジ名＋番号）
   Firestore のオフラインキャッシュを使うので、電波がなくても書き込みは端末に貯まり、つながったら自動で送られる。
   画面側（index.html）とは window.Reg（画面へ通知）と window.Cloud（画面から呼ぶ）でやり取りする。 */
import { FIREBASE_CONFIG, STORE_ID } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const Reg = window.Reg;

if (!FIREBASE_CONFIG) {
  Reg.onCloudStatus("off");
} else {
  start().catch(err => Reg.onCloudStatus("error", { msg: "クラウドに接続できませんでした（初回は電波のある場所で開いてください）" }));
}

async function start() {
  Reg.onCloudStatus("loading");
  const [{ initializeApp }, fs, au] = await Promise.all([
    import(SDK + "firebase-app.js"),
    import(SDK + "firebase-firestore.js"),
    import(SDK + "firebase-auth.js"),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const db = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
  });
  const auth = au.getAuth(app);
  const root = fs.doc(db, "stores", STORE_ID);
  const txCol = fs.collection(root, "tx");

  let user = null, stops = [];
  // Firestore は undefined を受け付けないので JSON で落とし、端末だけの印 synced も外す
  const clean = t => { const o = JSON.parse(JSON.stringify(t)); delete o.synced; return o; };
  const fail = err => Reg.onCloudStatus("error", {
    msg: err && err.code === "permission-denied"
      ? "このアカウントには書き込み権限がありません（firestore.rules を確認）"
      : "クラウドへの保存に失敗しました（" + (err && err.code || err) + "）",
  });

  window.Cloud = {
    ready: () => !!user,
    signIn: (email, pw) => au.signInWithEmailAndPassword(auth, email, pw),
    signOut: () => au.signOut(auth),
    putTx: t => fs.setDoc(fs.doc(txCol, t.id), clean(t), { merge: true }).catch(fail),
    setSettings: o => fs.setDoc(root, o, { merge: true }).catch(fail),
    addPrice: (price, ev) => fs.setDoc(root, { price, priceLog: fs.arrayUnion(ev) }, { merge: true }).catch(fail),
    async resetAll() {
      const snap = await fs.getDocs(txCol);
      for (let i = 0; i < snap.docs.length; i += 400) {
        const b = fs.writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
        await b.commit();
      }
      await fs.setDoc(root, { priceLog: [] }, { merge: true });
    },
  };

  au.onAuthStateChanged(auth, u => {
    stops.forEach(f => f()); stops = [];
    user = u;
    if (!u) { Reg.onCloudStatus("signedOut", { email: "" }); return; }
    Reg.onCloudStatus("loading", { email: u.email });

    // 設定と取引の両方がそろってから画面へ渡す
    let settings, txs, pend = { s: false, t: false }, cached = true;
    const emit = () => {
      if (settings === undefined || txs === undefined) return;
      Reg.onCloudData(settings, txs);
      const state = pend.s || pend.t ? (navigator.onLine ? "pending" : "offline") : cached && !navigator.onLine ? "offline" : "synced";
      Reg.onCloudStatus(state, { email: u.email });
    };
    stops.push(fs.onSnapshot(root, { includeMetadataChanges: true }, snap => {
      // キャッシュに無いだけで「クラウドが空」と決めつけない（新しい端末で設定を上書きしないため）
      if (snap.exists()) settings = snap.data();
      else if (!snap.metadata.fromCache) settings = null;
      pend.s = snap.metadata.hasPendingWrites;
      emit();
    }, fail));
    stops.push(fs.onSnapshot(txCol, { includeMetadataChanges: true }, snap => {
      txs = snap.docs.map(d => d.data());
      pend.t = snap.metadata.hasPendingWrites;
      cached = snap.metadata.fromCache;
      emit();
    }, fail));
  });

  addEventListener("online", () => user && Reg.onCloudStatus("pending", { email: user.email }));
  addEventListener("offline", () => user && Reg.onCloudStatus("offline", { email: user.email }));
}
