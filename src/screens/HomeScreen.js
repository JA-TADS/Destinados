import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, FlatList, StyleSheet } from "react-native";
import MatchModal from "../shared/MatchModal";
import ProfilePreviewModal from "../shared/ProfilePreviewModal";
import { fetchDiscoverUsers, sendSwipe, getOrCreateChat } from "../services/data";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { registerForPushNotifications } from "../services/notifications";
import { getAndUpdateLocation } from "../services/location";

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
  const [imageErrors, setImageErrors] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      
      // Registra para notificações push
      await registerForPushNotifications();
      
      // Atualiza localização automaticamente em background (não bloqueia a UI)
      const me = auth.currentUser;
      if (me) {
        console.log('🔄 [HOME] Atualizando localização em background...');
        getAndUpdateLocation(me.uid).catch(err => {
          console.log('❌ [HOME] Erro ao atualizar localização em background:', err);
        });
      }
      
      const list = await fetchDiscoverUsers(25, false); // não incluir perfis já interagidos
      // carrega meu perfil para exibir minha foto no modal de match
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
    setImageErrors(new Set()); // Limpa erros quando muda de perfil
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
    <View style={styles.container}>
      {/* Decorações de coração */}
      <Text style={styles.heartDecoration1}>❤️</Text>
      <Text style={styles.heartDecoration2}>💕</Text>
      <Text style={styles.heartDecoration3}>💖</Text>
      <Text style={styles.heartDecoration4}>💗</Text>
      <Text style={styles.heartDecoration5}>💝</Text>
      <Text style={styles.heartDecoration6}>💓</Text>
      
      <View style={styles.content}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Carregando perfis…</Text>
        </View>
      ) : profile ? (
        <View style={{ flex: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#eee" }} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
          {photoUris.length <= 1 ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewOpen(true)} style={{ width: cardWidth, height: '100%' }}>
              {imageErrors.has(photoUris[0]) ? (
                <View style={{ width: '100%', height: '100%', backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#999', fontSize: 16 }}>Imagem não disponível</Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: photoUris[0] }} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode='cover'
                  onError={() => {
                    setImageErrors(prev => new Set([...prev, photoUris[0]]));
                  }}
                />
              )}
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
                <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewOpen(true)} style={{ width: cardWidth, height: '100%' }}>
                  {imageErrors.has(item) ? (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#999', fontSize: 16 }}>Imagem não disponível</Text>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: item }} 
                      style={{ width: '100%', height: '100%' }} 
                      resizeMode='cover'
                      onError={() => {
                        setImageErrors(prev => new Set([...prev, item]));
                      }}
                    />
                  )}
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
                const nameAge = age != null ? `${profile.firstName || "Usuário"}, ${age}` : (profile.firstName || "Usuário");
                const distance = profile.distance != null ? ` • ${Math.round(profile.distance)}km` : '';
                return nameAge + distance;
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
          <Text style={{ fontSize: 22 }}>💔</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLike} disabled={!profile || actionLoading} style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: (!profile || actionLoading) ? "#FFB3C0" : "#FF6B7D" }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#FFF5F7",
  },
  heartDecoration1: {
    position: "absolute",
    top: "15%",
    left: "10%",
    fontSize: 30,
    opacity: 0.3,
    transform: [{ rotate: "-15deg" }],
    zIndex: 0,
  },
  heartDecoration2: {
    position: "absolute",
    top: "25%",
    right: "15%",
    fontSize: 25,
    opacity: 0.25,
    transform: [{ rotate: "20deg" }],
    zIndex: 0,
  },
  heartDecoration3: {
    position: "absolute",
    bottom: "30%",
    left: "8%",
    fontSize: 28,
    opacity: 0.3,
    transform: [{ rotate: "10deg" }],
    zIndex: 0,
  },
  heartDecoration4: {
    position: "absolute",
    bottom: "20%",
    right: "12%",
    fontSize: 32,
    opacity: 0.25,
    transform: [{ rotate: "-25deg" }],
    zIndex: 0,
  },
  heartDecoration5: {
    position: "absolute",
    top: "50%",
    left: "5%",
    fontSize: 22,
    opacity: 0.2,
    transform: [{ rotate: "15deg" }],
    zIndex: 0,
  },
  heartDecoration6: {
    position: "absolute",
    top: "70%",
    right: "8%",
    fontSize: 26,
    opacity: 0.25,
    transform: [{ rotate: "-10deg" }],
    zIndex: 0,
  },
  content: {
    flex: 1,
    padding: 16,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});


