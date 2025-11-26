import { auth, db } from "./firebase";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, where, Timestamp, addDoc, limit } from "firebase/firestore";
import { calculateDistance } from "./location";
import { sendMatchNotification, sendMessageNotification } from "./notifications";

export async function fetchDiscoverUsers(limitCount = 20, includeSeen = false, maxDistanceKm = 50) {
  const me = auth.currentUser;
  if (!me) return [];

  // Obtém minha localização
  const myDoc = await getDoc(doc(db, "users", me.uid));
  const myData = myDoc.exists() ? myDoc.data() : null;
  const myLocation = myData?.location;

  // Carrega meus swipes para filtrar já vistos
  let already = new Set([me.uid]);
  if (!includeSeen) {
    const mySwipesSnap = await getDocs(query(collection(db, "swipes"), where("from", "==", me.uid)));
    mySwipesSnap.forEach((d) => already.add(d.data().to));
  }

  // Busca todos os usuários e filtra no cliente
  const usersSnap = await getDocs(collection(db, "users"));
  const users = [];
  usersSnap.forEach((d) => {
    const data = d.data();
    if (!already.has(d.id) && data.profileComplete) {
      const user = { id: d.id, ...data };
      
      // Filtra por distância se tiver localização
      if (myLocation && data.location) {
        const distance = calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          data.location.latitude,
          data.location.longitude
        );
        user.distance = distance;
        if (distance > maxDistanceKm) return; // Pula se estiver muito longe
      }
      
      users.push(user);
    }
  });

  // Ordena por distância (mais próximos primeiro) se tiver localização
  if (myLocation) {
    users.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }

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
      
      // Envia notificação push para ambos os usuários
      try {
        // Busca dados de ambos os usuários
        const otherUserDoc = await getDoc(doc(db, "users", toUid));
        const myUserDoc = await getDoc(doc(db, "users", me.uid));
        
        if (otherUserDoc.exists() && myUserDoc.exists()) {
          const otherName = otherUserDoc.data().firstName || "Alguém";
          const myName = myUserDoc.data().firstName || "Você";
          
          console.log('🎯 MATCH DETECTADO! Enviando notificações...');
          console.log('👤 Outro usuário:', otherName, '- Token:', otherUserDoc.data().pushToken ? '✅ existe' : '❌ não existe');
          console.log('👤 Meu usuário:', myName, '- Token:', myUserDoc.data().pushToken ? '✅ existe' : '❌ não existe');
          
          // Notificação para o outro usuário (com o nome do usuário atual)
          if (otherUserDoc.data().pushToken) {
            console.log('📤 Enviando notificação para o outro usuário...');
            await sendMatchNotification(toUid, myName);
          } else {
            console.log('⚠️ Outro usuário não tem pushToken salvo - ele precisa abrir o app para receber notificações');
          }
          
          // Notificação para o usuário atual (com o nome do outro usuário)
          // Nota: Se o app estiver aberto, a notificação push pode não aparecer
          // mas o modal de match já aparece na tela
          if (myUserDoc.data().pushToken) {
            console.log('📤 Enviando notificação para o usuário atual...');
            await sendMatchNotification(me.uid, otherName);
          } else {
            console.log('⚠️ Usuário atual não tem pushToken salvo');
          }
        } else {
          console.log('❌ Erro: Não foi possível encontrar os dados dos usuários');
        }
      } catch (e) {
        console.error('❌ Erro ao enviar notificação:', e);
        console.error('Detalhes:', e.message);
      }
      
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
  
  // Envia a mensagem
  await addDoc(collection(db, "chats", chatId, "messages"), {
    from: me.uid,
    text,
    createdAt: Timestamp.now()
  });
  await setDoc(doc(db, "chats", chatId), { updatedAt: Timestamp.now() }, { merge: true });
  
  // Envia notificação push para o destinatário
  try {
    await sendMessageNotification(chatId, me.uid, text);
  } catch (error) {
    console.error('Erro ao enviar notificação de mensagem:', error);
  }
}


