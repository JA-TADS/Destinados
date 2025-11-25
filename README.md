# Destinados - App de Relacionamento

Aplicativo mobile de relacionamento estilo Tinder, desenvolvido com React Native (Expo) e Firebase.

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação
- Login e cadastro com Firebase Authentication (email/senha)
- Persistência de sessão

### ✅ Banco de Dados Remoto
- Firestore para armazenar:
  - Perfis de usuários
  - Swipes (likes/dislikes)
  - Matches
  - Chats e mensagens

### ✅ Geolocalização
- Captura localização do usuário ao salvar perfil
- Filtra perfis por proximidade (raio de 50km por padrão)
- Exibe distância no card do perfil
- Ordena perfis do mais próximo ao mais distante

### ✅ Notificações Push
- Registro automático ao abrir a Home
- Notificação quando ocorre match
- Integração com Expo Push Notifications

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

### Firebase
1. Copie `config/firebaseConfig.example.json` para `config/firebaseConfig.json`
2. Preencha com suas credenciais do Firebase

### Cloudinary (Upload de Fotos)
1. Copie `config/cloudinaryConfig.example.json` para `config/cloudinaryConfig.json`
2. Preencha com suas credenciais do Cloudinary:
   - `cloudName`: Seu Cloud Name do Cloudinary
   - `uploadPreset`: Seu Upload Preset (recomendado: criar um preset "Unsigned")
3. O arquivo `cloudinaryConfig.json` não será versionado no Git

### Expo Push Notifications
- O `projectId` em `src/services/notifications.js` deve ser o `slug` do `app.json` (atualmente: "destinados")

## 🚀 Executar

```bash
npm run start
```

## 📱 Estrutura do Projeto

- `src/screens/` - Telas do app
- `src/services/` - Serviços (Firebase, dados, localização, notificações)
- `src/navigation/` - Configuração de rotas
- `src/shared/` - Componentes compartilhados
- `config/` - Configurações (ignoradas pelo Git)

## 🔐 Segurança

- Credenciais do Firebase em `config/firebaseConfig.json` (não versionado)
- Credenciais do Cloudinary em `config/cloudinaryConfig.json` (não versionado)
- Regras do Firestore configuradas para segurança
- Permissões de localização solicitadas ao usuário

## 📝 Notas

- Geolocalização: solicita permissão ao salvar perfil
- Notificações: solicita permissão ao abrir a Home
- Distância máxima padrão: 50km (configurável em `fetchDiscoverUsers`)

