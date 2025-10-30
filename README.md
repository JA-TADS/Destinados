Destinados (React Native + Expo + Firebase)

Aplicativo mobile de relacionamento com onboarding, login/cadastro, perfil, interesses, tela principal com likes/dislikes e modal de match, abas para Matches, Chats e Perfil.

Requisitos
- Node LTS
- Expo CLI (via npx expo)
- Conta Firebase (Auth, Firestore, Storage habilitados)

Instalação
```
npm install
npm run start
```
Abra no Expo Go (Android/iOS) ou rode `npm run android`/`npm run ios`.

Configuração do Firebase
- Edite `src/services/firebase.js` e substitua o objeto de configuração `firebaseConfig` pelas suas chaves
- No Firebase Console: habilite Email/Password, crie Firestore e habilite Storage

Navegação
- Stack: Intro -> Login/Signup -> ProfileDetails -> Interests -> Main
- Tabs em Main: Home, Matches, Chats, Perfil

Próximos passos
- Implementar serviços reais (Firestore) para perfis, swipes, matches e chats
- Persistir foto no Storage
- Regras de segurança do Firestore
- Swipe com gesture-handler/reanimated


