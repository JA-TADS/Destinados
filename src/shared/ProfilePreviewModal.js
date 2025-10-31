import React, { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Image, FlatList, Dimensions, Pressable, ScrollView } from "react-native";

export default function ProfilePreviewModal({ visible, onClose, profile }) {
  const [idx, setIdx] = useState(0);
  const [cardWidth, setCardWidth] = useState(Dimensions.get('window').width * 0.9);

  const photoUris = useMemo(() => {
    if (!profile) return ["https://picsum.photos/600"];
    if (Array.isArray(profile.photos)) {
      const list = profile.photos.filter((u) => typeof u === 'string' && u.length > 0);
      return list.length > 0 ? list : ["https://picsum.photos/600"];
    }
    if (typeof profile.photos === 'string' && profile.photos.length > 0) return [profile.photos];
    return ["https://picsum.photos/600"];
  }, [profile]);

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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Pressable onPress={() => {}} style={{ width: '95%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          <View onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)} style={{ width: '100%', aspectRatio: 1 }}>
            {photoUris.length <= 1 ? (
              <Image source={{ uri: photoUris[0] }} style={{ width: '100%', height: '100%' }} resizeMode='cover' />
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
                  const i = Math.round(contentOffset.x / width);
                  setIdx(i);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={{ width: cardWidth, height: '100%' }} resizeMode='cover' />
                )}
              />
            )}
            {photoUris.length > 1 ? (
              <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row' }}>
                {photoUris.map((_, i) => (
                  <View key={i} style={{ width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </View>
            ) : null}
          </View>
          <ScrollView style={{ padding: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
              {(() => {
                const age = getAgeFromBirth(profile?.birth);
                const name = `${profile?.firstName || ''}${profile?.lastName ? ' ' + profile.lastName : ''}`.trim() || 'Usuário';
                return age != null ? `${name}, ${age}` : name;
              })()}
            </Text>
            {profile?.about ? <Text style={{ color: '#333', marginBottom: 12 }}>{profile.about}</Text> : null}
            {Array.isArray(profile?.interests) && profile.interests.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {profile.interests.map((it) => (
                  <View key={it} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: '#FF4D67', backgroundColor: '#FFE5EA', marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ color: '#FF4D67' }}>{it}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end', marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: '#FF4D67', backgroundColor: '#fff' }}>
              <Text style={{ color: '#FF4D67', fontWeight: '600' }}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


