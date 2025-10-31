import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, FlatList } from "react-native";
import MatchModal from "../shared/MatchModal";
import ProfilePreviewModal from "../shared/ProfilePreviewModal";
import { fetchDiscoverUsers, sendSwipe, getOrCreateChat } from "../services/data";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(Dimensions.get('window').width);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const getAgeFromBirth = (birthStr) => {
    if (!birthStr || typeof birthStr !== 'string') return null;
    const parts = birthStr.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts.map((v) => parseInt(v, 10));
    if (!dd || !mm || !yyyy) return null;
    const today = new Date();
    let age = today.getFullYear() - yyyy;
    const m = today.getMonth() + 1 - mm;
    if (m < 0 || (m === 0 && today.getDate() < dd)) age--;
    return age >= 0 && age < 120 ? age : null;
  };

  const photoUris = useMemo(() => {
    if (!profile) return ["https://picsum.photos/400"];
    if (Array.isArray(profile.photos)) {
      const list = profile.photos.filter((u) => typeof u === 'string' && u.length > 0);
      return list.length > 0 ? list : ["https://picsum.photos/400"];
    }
    if (typeof profile.photos === 'string' && profile.photos.length > 0) return [profile.photos];
    return ["https://picsum.photos/400"];
  }, [profile]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [profile?.id]);

  const onLike = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await sendSwipe(profile.id, true);
      if (res.match) {
        const myPhoto = (myProfile?.photos && myProfile.photos[0]) || "https://picsum.photos/200?me";
        const otherPhoto = (profile?.photos && profile.photos[0]) || "https://picsum.photos/400?1";
        setMatch({ otherId: profile.id, me: { name: myProfile?.firstName || "Você", photo: myPhoto }, other: { name: profile.firstName || "", photo: otherPhoto } });
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
        <View style={{ flex: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#eee" }} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
          {photoUris.length <= 1 ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewOpen(true)}>
              <Image source={{ uri: photoUris[0] }} style={{ width: cardWidth, height: '100%' }} resizeMode='cover' />
            </TouchableOpacity>
          ) : (
            <FlatList
              data={photoUris}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={cardWidth}
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const { contentOffset, layoutMeasurement } = e.nativeEvent;
                const width = Math.max(layoutMeasurement.width, 1);
                const idx = Math.round(contentOffset.x / width);
                setPhotoIndex(idx);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewOpen(true)}>
                  <Image source={{ uri: item }} style={{ width: cardWidth, height: '100%' }} resizeMode='cover' />
                </TouchableOpacity>
              )}
            />
          )}

          {/* Dots indicator */}
          {photoUris.length > 1 ? (
            <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row' }}>
              {photoUris.map((_, i) => (
                <View key={i} style={{ width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </View>
          ) : null}

          <View style={{ position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 4 }}>
              {(() => {
                const age = getAgeFromBirth(profile.birth);
                return age != null ? `${profile.firstName || "Usuário"}, ${age}` : (profile.firstName || "Usuário");
              })()}
            </Text>
            {profile.about ? (
              <Text style={{ color: "#f2f2f2" }} numberOfLines={2}>{profile.about}</Text>
            ) : null}
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
      <MatchModal
        visible={!!match}
        onClose={() => setMatch(null)}
        me={match?.me}
        other={match?.other}
        onStartChat={async () => {
          try {
            const chatId = await getOrCreateChat(match?.otherId);
            setMatch(null);
            // navigation prop is available in tab screens
            // eslint-disable-next-line no-undef
            navigation.navigate("Chat", { chatId });
          } catch {
            setMatch(null);
          }
        }}
      />

      <ProfilePreviewModal visible={previewOpen && !!profile} onClose={() => setPreviewOpen(false)} profile={profile} />
    </View>
  );
}


