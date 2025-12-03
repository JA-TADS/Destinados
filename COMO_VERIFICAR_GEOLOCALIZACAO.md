# 📍 Como Verificar a Geolocalização

## 🔍 Como Funciona Agora

### 1. **Ao Abrir a HomeScreen**
- ✅ Localização é atualizada automaticamente em background
- ✅ Não bloqueia a tela enquanto busca
- ✅ Logs aparecem no console

### 2. **Ao Buscar Perfis (fetchDiscoverUsers)**
- ✅ Verifica se sua localização salva tem menos de 30 minutos
- ✅ Se estiver antiga ou não existir, busca uma nova
- ✅ Usa a localização atualizada para filtrar por distância

### 3. **Ao Salvar Perfil**
- ✅ Continua atualizando a localização (como antes)

## 📊 Como Verificar nos Logs

### Abra o Console do Expo/Metro Bundler

Você verá logs como estes:

```
📍 [LOCATION] Iniciando busca de localização...
✅ [LOCATION] Permissão concedida
✅ [LOCATION] Serviços de localização habilitados
⏱️ [LOCATION] Buscando localização (timeout: 10000ms)...
✅ [LOCATION] Localização obtida em 1234ms:
   📍 Lat: -23.550520, Lon: -46.633308
💾 [LOCATION] Atualizando localização no Firebase para usuário abc12345...
✅ [LOCATION] Localização atualizada no Firebase com sucesso
```

### Quando a Localização Está Válida:
```
✅ [LOCATION] Localização válida (idade: 5.2 minutos)
✅ [DISCOVER] Localização válida encontrada, usando localização salva
```

### Quando Precisa Atualizar:
```
⚠️ [LOCATION] Localização muito antiga (idade: 45.3 minutos, máximo: 30 minutos)
🔄 [DISCOVER] Localização não encontrada ou muito antiga, tentando atualizar...
```

## 🧪 Como Testar

### Teste 1: Verificar Atualização Automática
1. Abra o app e vá para a HomeScreen
2. Olhe o console - deve aparecer: `🔄 [HOME] Atualizando localização em background...`
3. Deve aparecer logs de busca e atualização

### Teste 2: Verificar Validação de Idade
1. No Firebase Console, edite manualmente sua localização:
   - Vá em `users` → seu `uid` → `location`
   - Mude `updatedAt` para um timestamp muito antigo (ex: 1 hora atrás)
2. Feche e reabra o app
3. Vá para a HomeScreen
4. Deve aparecer: `⚠️ [LOCATION] Localização muito antiga...`
5. Deve tentar atualizar automaticamente

### Teste 3: Verificar Timeout
1. Desabilite o GPS no dispositivo
2. Abra o app
3. Deve aparecer: `❌ [LOCATION] Serviços de localização desabilitados`
4. Ou: `❌ [LOCATION] Erro ao obter localização: Timeout...`

### Teste 4: Verificar Filtro de Distância
1. Certifique-se de ter localização válida
2. Busque perfis na HomeScreen
3. Os perfis devem aparecer ordenados por distância (mais próximos primeiro)
4. A distância deve aparecer no card: `Nome, 25 • 5km`

## 📱 Onde Ver os Logs

### No Terminal (Metro Bundler):
- Os logs aparecem diretamente no terminal onde você rodou `expo start`

### No Dispositivo (React Native Debugger):
- Se estiver usando React Native Debugger, os logs aparecem lá também

### No Console do Navegador (se usar Expo Web):
- Abra DevTools (F12) → Console

## 🔧 Troubleshooting

### Se não aparecer nenhum log:
- Verifique se o Metro Bundler está rodando
- Recarregue o app (shake → Reload)

### Se aparecer "Permissão negada":
- Vá nas configurações do dispositivo
- Permissões → App → Localização → Permitir

### Se aparecer "Serviços desabilitados":
- Ative o GPS/Localização nas configurações do dispositivo

### Se a localização não atualizar:
- Verifique se está conectado à internet
- Verifique se o Firebase está configurado corretamente
- Veja os logs de erro no console

## 📝 Logs Esperados

### Fluxo Normal (Primeira Vez):
```
🔄 [HOME] Atualizando localização em background...
📍 [LOCATION] Iniciando busca de localização...
✅ [LOCATION] Permissão concedida
✅ [LOCATION] Serviços de localização habilitados
⏱️ [LOCATION] Buscando localização (timeout: 10000ms)...
✅ [LOCATION] Localização obtida em 2345ms:
   📍 Lat: -23.550520, Lon: -46.633308
💾 [LOCATION] Atualizando localização no Firebase...
✅ [LOCATION] Localização atualizada no Firebase com sucesso
```

### Fluxo com Localização Antiga:
```
⚠️ [LOCATION] Localização muito antiga (idade: 45.3 minutos, máximo: 30 minutos)
🔄 [DISCOVER] Localização não encontrada ou muito antiga, tentando atualizar...
📍 [LOCATION] Iniciando busca de localização...
✅ [LOCATION] Localização obtida...
✅ [DISCOVER] Localização atualizada, continuando busca de perfis...
```

