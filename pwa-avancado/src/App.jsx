import React, { useState, useEffect } from 'react';
// Importação virtual do plugin PWA para registrar o SW
import { registerSW } from 'virtual:pwa-register';

// Em um app real, você geraria isso no backend (biblioteca web-push)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'; 

function App() {
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState(navigator.onLine ? 'Online' : 'Offline');
  const [swReg, setSwReg] = useState(null);

  useEffect(() => {
    // 1. Registrar o Service Worker
    const updateSW = registerSW({
      onRegisteredSW(swUrl, r) {
        console.log('Service Worker registrado em:', swUrl);
        setSwReg(r);
      }
    });

    // 2. Listeners de status de rede
    const updateStatus = () => setStatus(navigator.onLine ? 'Online' : 'Offline');
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // 3. Assinar Push Notifications
  const subscribeToPush = async () => {
    if (!swReg) return alert('Service Worker ainda não registrado. Tente recarregar.');
    if (!('PushManager' in window)) return alert('Push não suportado neste navegador.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return alert('Permissão de notificação negada!');

    try {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log('Objeto de Inscrição (enviar ao Backend):', JSON.stringify(subscription));
      alert('Inscrito com sucesso! Cheque o console para ver o objeto de subscrição.');
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      alert('Erro ao inscrever (verifique se está rodando em HTTPS ou localhost).');
    }
  };

  // 4. Testar Background Sync
  const sendSyncData = async (data) => {
    const url = '/api/sync-data'; // Endpoint fictício interceptado pelo SW
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 202) {
        alert('⚠️ Sem internet: Dados salvos na fila (Background Sync)!');
      } else if (response.ok) {
        alert('✅ Online: Dados enviados com sucesso!');
      }
    } catch (error) {
      console.error('Erro tratado pelo SW:', error);
    }
  };

  const handleCount = () => {
    const newCount = count + 1;
    setCount(newCount);
    // Tenta enviar dados a cada clique
    sendSyncData({ timestamp: Date.now(), count: newCount });
  }

  // Função utilitária para converter a chave VAPID
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>PWA Avançado Demo</h1>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: status === 'Online' ? '#d1fae5' : '#fee2e2',
        borderRadius: '8px',
        display: 'inline-block',
        marginBottom: '20px'
      }}>
        Status: <strong>{status}</strong>
      </div>

      <br />

      <button onClick={handleCount} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}>
        Incrementar ({count}) e Testar Sync
      </button>

      <button onClick={subscribeToPush} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        Ativar Push Notification
      </button>
      
      <p style={{marginTop: '20px', fontSize: '0.9rem', color: '#666'}}>
        Para testar Sync: Abra o DevTools, vá em Network, marque "Offline" e clique em Incrementar.
      </p>
    </div>
  );
}
export default App;