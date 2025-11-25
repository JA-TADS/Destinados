// Configuração do Cloudinary
let cloudinaryConfig;
try {
  cloudinaryConfig = require("../../config/cloudinaryConfig.json");
} catch (e) {
  // Fallback: usa variáveis de ambiente se o arquivo não existir
  cloudinaryConfig = {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  };
  
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
    console.error("Cloudinary não configurado! Crie o arquivo config/cloudinaryConfig.json ou defina as variáveis de ambiente.");
  }
}

export const uploadToCloudinary = async (uri) => {
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

  const data = new FormData();
  data.append("file", { uri, type: "image/jpeg", name: "photo.jpg" });
  data.append("upload_preset", cloudinaryConfig.uploadPreset);

  const res = await fetch(endpoint, { method: "POST", body: data });
  const json = await res.json();
  if (!json.secure_url) throw new Error("Falha no upload da imagem");
  return json.secure_url;
};

