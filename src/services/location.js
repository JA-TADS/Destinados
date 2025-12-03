import * as Location from 'expo-location';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Obtém a localização atual do usuário com timeout e tratamento de erros melhorado
 * @param {Object} options - Opções para obter localização
 * @param {number} options.timeout - Timeout em milissegundos (padrão: 10000)
 * @param {Location.Accuracy} options.accuracy - Precisão desejada (padrão: Balanced)
 * @returns {Promise<{latitude: number, longitude: number, timestamp: number} | null>}
 */
export async function getCurrentLocation(options = {}) {
  const { timeout = 10000, accuracy = Location.Accuracy.Balanced } = options;
  
  console.log('📍 [LOCATION] Iniciando busca de localização...');
  
  try {
    // Verifica permissões primeiro
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('❌ [LOCATION] Permissão de localização negada');
      return null;
    }
    console.log('✅ [LOCATION] Permissão concedida');

    // Verifica se os serviços de localização estão habilitados
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      console.warn('❌ [LOCATION] Serviços de localização desabilitados');
      return null;
    }
    console.log('✅ [LOCATION] Serviços de localização habilitados');

    // Obtém localização com timeout
    console.log(`⏱️ [LOCATION] Buscando localização (timeout: ${timeout}ms)...`);
    const locationPromise = Location.getCurrentPositionAsync({ 
      accuracy,
      maximumAge: 60000, // Aceita localização com até 1 minuto de idade
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao obter localização')), timeout)
    );

    const startTime = Date.now();
    const location = await Promise.race([locationPromise, timeoutPromise]);
    const elapsed = Date.now() - startTime;

    if (!location || !location.coords) {
      console.warn('❌ [LOCATION] Localização inválida retornada');
      return null;
    }

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: Date.now()
    };

    console.log(`✅ [LOCATION] Localização obtida em ${elapsed}ms:`);
    console.log(`   📍 Lat: ${result.latitude.toFixed(6)}, Lon: ${result.longitude.toFixed(6)}`);
    
    return result;
  } catch (error) {
    console.error('❌ [LOCATION] Erro ao obter localização:', error.message || error);
    return null;
  }
}

/**
 * Verifica se uma localização é válida e não está muito antiga
 * @param {Object} location - Objeto de localização com timestamp
 * @param {number} maxAgeMinutes - Idade máxima em minutos (padrão: 30)
 * @returns {boolean}
 */
export function isLocationValid(location, maxAgeMinutes = 30) {
  if (!location || !location.latitude || !location.longitude) {
    console.log('❌ [LOCATION] Localização inválida: dados faltando');
    return false;
  }

  // Verifica se tem timestamp
  if (location.timestamp || location.updatedAt) {
    const timestamp = location.timestamp || location.updatedAt;
    const timestampValue = typeof timestamp === 'number' ? timestamp : timestamp.toMillis();
    const age = Date.now() - timestampValue;
    const maxAge = maxAgeMinutes * 60 * 1000;
    const ageMinutes = Math.round(age / 60000 * 10) / 10;
    
    if (age < maxAge) {
      console.log(`✅ [LOCATION] Localização válida (idade: ${ageMinutes} minutos)`);
      return true;
    } else {
      console.log(`⚠️ [LOCATION] Localização muito antiga (idade: ${ageMinutes} minutos, máximo: ${maxAgeMinutes} minutos)`);
      return false;
    }
  }

  // Se não tem timestamp, assume que é válida (compatibilidade com dados antigos)
  console.log('⚠️ [LOCATION] Localização sem timestamp, assumindo válida (compatibilidade)');
  return true;
}

/**
 * Atualiza a localização do usuário no Firebase
 * @param {string} userId - ID do usuário
 * @param {Object} location - Objeto de localização
 * @returns {Promise<boolean>} - true se atualizado com sucesso
 */
export async function updateUserLocation(userId, location) {
  if (!userId || !location || !location.latitude || !location.longitude) {
    console.log('❌ [LOCATION] Dados inválidos para atualizar localização');
    return false;
  }

  try {
    const locationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.timestamp || Date.now()
    };

    console.log(`💾 [LOCATION] Atualizando localização no Firebase para usuário ${userId.substring(0, 8)}...`);
    await setDoc(
      doc(db, 'users', userId),
      { location: locationData },
      { merge: true }
    );

    console.log('✅ [LOCATION] Localização atualizada no Firebase com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [LOCATION] Erro ao atualizar localização no Firebase:', error);
    return false;
  }
}

/**
 * Obtém e atualiza a localização do usuário atual no Firebase
 * @param {string} userId - ID do usuário
 * @returns {Promise<{latitude: number, longitude: number, timestamp: number} | null>}
 */
export async function getAndUpdateLocation(userId) {
  console.log(`🔄 [LOCATION] Obtendo e atualizando localização para usuário ${userId.substring(0, 8)}...`);
  const location = await getCurrentLocation();
  if (location && userId) {
    await updateUserLocation(userId, location);
  } else if (!location) {
    console.log('⚠️ [LOCATION] Não foi possível obter localização, não será atualizada');
  }
  return location;
}

// Calcula distância entre duas coordenadas (Haversine)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
}

