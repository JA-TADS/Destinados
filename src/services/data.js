import { auth, db } from "./firebase";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, where, Timestamp, addDoc, limit } from "firebase/firestore";

export async function fetchDiscoverUsers(limitCount = 20, includeSeen = false) {
  const me = auth.currentUser;
  if (!me) return [];

  // Carrega meus swipes para filtrar já vistos
  let already = new Set([me.uid]);
  if (!includeSeen) {
    const mySwipesSnap = await getDocs(query(collection(db, "swipes"), where("from", "==", me.uid)));
    mySwipesSnap.forEach((d) => already.add(d.data().to));
  }

  // Busca todos os usuários (simples) e filtra no cliente
  const usersSnap = await getDocs(collection(db, "users"));
  const users = [];
  usersSnap.forEach((d) => {
    const data = d.data();
    if (!already.has(d.id) && data.profileComplete) {
      users.push({ id: d.id, ...data });
    }
  });

  return users.slice(0, limitCount);
}

export async function sendSwipe(toUid, like) {
  const me = auth.currentUser;
  if (!me || !toUid) return { match: null };

  const swipeId = `${me.uid}_${toUid}`;
  await setDoc(doc(db, "swipes", swipeId), {
    from: me.uid,
    to: toUid,
    like: !!like,
    createdAt: Timestamp.now()
  }, { merge: true });

  if (like) {
    // Verifica se o outro já deu like em mim
    const otherSwipeId = `${toUid}_${me.uid}`;
    const otherSnap = await getDoc(doc(db, "swipes", otherSwipeId));
    if (otherSnap.exists() && otherSnap.data().like) {
      const matchId = [me.uid, toUid].sort().join("_");
      const matchDoc = doc(db, "matches", matchId);
      await setDoc(matchDoc, {
        users: [me.uid, toUid],
        createdAt: Timestamp.now()
      }, { merge: true });
      return { match: matchId };
    }
  }
  return { match: null };
}

export async function fetchMatches() {
  const me = auth.currentUser;
  if (!me) return [];
  const matchesSnap = await getDocs(query(collection(db, "matches"), where("users", "array-contains", me.uid)));
  const out = [];
  for (const m of matchesSnap.docs) {
    const users = m.data().users || [];
    const otherId = users.find((u) => u !== me.uid);
    if (!otherId) continue;
    const other = await getDoc(doc(db, "users", otherId));
    if (other.exists()) out.push({ id: m.id, otherId, other: { id: other.id, ...other.data() } });
  }
  return out;
}

export async function getOrCreateChat(otherUid) {
  const me = auth.currentUser;
  if (!me) return null;
  const chatId = [me.uid, otherUid].sort().join("_");
  const ref = doc(db, "chats", chatId);
  await setDoc(ref, { users: [me.uid, otherUid], updatedAt: Timestamp.now() }, { merge: true });
  return chatId;
}

export function listenChats(callback) {
  const me = auth.currentUser;
  if (!me) return () => {};
  const q = query(collection(db, "chats"), where("users", "array-contains", me.uid), orderBy("updatedAt", "desc"), limit(50));
  return onSnapshot(q, async (snap) => {
    const items = [];
    for (const d of snap.docs) {
      const users = d.data().users || [];
      const otherId = users.find((u) => u !== me.uid);
      let other = null;
      if (otherId) {
        const o = await getDoc(doc(db, "users", otherId));
        if (o.exists()) other = { id: o.id, ...o.data() };
      }
      items.push({ id: d.id, ...d.data(), other });
    }
    callback(items);
  });
}

export function listenMessages(chatId, callback) {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}

export async function sendMessage(chatId, text) {
  const me = auth.currentUser;
  if (!me || !text) return;
  await addDoc(collection(db, "chats", chatId, "messages"), {
    from: me.uid,
    text,
    createdAt: Timestamp.now()
  });
  await setDoc(doc(db, "chats", chatId), { updatedAt: Timestamp.now() }, { merge: true });
}


