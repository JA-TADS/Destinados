import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import MatchModal from "../shared/MatchModal";
import { fetchDiscoverUsers, sendSwipe } from "../services/data";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function HomeScreen() {
  const [profiles, setProfiles] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const list = await fetchDiscoverUsers(25, true); // incluir já vistos para facilitar testes
      // carrega meu perfil para exibir minha foto no modal de match
      const me = auth.currentUser;
      if (me) {
        try {
          const snap = await getDoc(doc(db, "users", me.uid));
          if (snap.exists()) setMyProfile({ id: me.uid, ...snap.data() });
        } catch {}
      }
      if (mounted) {
        setProfiles(list);
        setIndex(0);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const profile = useMemo(() => (index < profiles.length ? profiles[index] : null), [profiles, index]);

  const onLike = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await sendSwipe(profile.id, true);
      if (res.match) {
        const myPhoto = (myProfile?.photos && myProfile.photos[0]) || "https://picsum.photos/200?me";
        const otherPhoto = (profile?.photos && profile.photos[0]) || "https://picsum.photos/400?1";
        setMatch({ me: { name: myProfile?.firstName || "Você", photo: myPhoto }, other: { name: profile.firstName || "", photo: otherPhoto } });
      }
    } catch {}
    finally {
      setIndex((i) => i + 1);
      setActionLoading(false);
    }
  };

  const onDislike = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);
    try { await sendSwipe(profile.id, false); } catch {}
    finally {
      setIndex((i) => i + 1);
      setActionLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Carregando perfis…</Text>
        </View>
      ) : profile ? (
        <View style={{ flex: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#eee" }}>
          <Image source={{ uri: (profile?.photos && profile.photos[0]) || "https://picsum.photos/400" }} style={{ flex: 1 }} />
          <View style={{ position: "absolute", left: 12, bottom: 12, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>{profile.firstName || "Usuário"}</Text>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Sem mais perfis por agora</Text>
        </View>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-evenly", marginTop: 16 }}>
        <TouchableOpacity onPress={onDislike} disabled={!profile || actionLoading} style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: (!profile || actionLoading) ? "#ddd" : "#eee" }}>
          <Text style={{ fontSize: 22 }}>✖️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLike} disabled={!profile || actionLoading} style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: (!profile || actionLoading) ? "#FFB3C0" : "#FF4D67" }}>
          <Text style={{ fontSize: 22, color: "#fff" }}>❤</Text>
        </TouchableOpacity>
      </View>
      <MatchModal visible={!!match} onClose={() => setMatch(null)} me={match?.me} other={match?.other} />
    </View>
  );
}


