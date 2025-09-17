console.log('Service Worker loading...');

// Tự động activate service worker mới
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  self.skipWaiting(); // Force activate immediately
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim()); // Take control immediately
});

importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

console.log('Firebase scripts imported');

firebase.initializeApp({
  apiKey: "AIzaSyDHgZwBkp2syivHbLWM6Tgu3UoDBAQB8r0",
  authDomain: "smartonetestnoti.firebaseapp.com",
  projectId: "smartonetestnoti",
  storageBucket: "smartonetestnoti.appspot.com",
  messagingSenderId: "419243653443",
  appId: "1:419243653443:web:26348d8c428f2688c8d7f6"
});

console.log('Firebase initialized in service worker');

const messaging = firebase.messaging();

// Handle background messages từ FCM
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'FCM Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/icon.png',
    badge: '/icon.png',
    data: {
      click_action: payload.notification?.click_action || payload.data?.click_action || 'https://google.com',
      source: 'fcm',
      payload: payload
    },
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Mở'
      },
      {
        action: 'close', 
        title: 'Đóng'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Test push event handler (cho DevTools test)
self.addEventListener('push', function(event) {
  console.log('[PUSH] Push event received in service worker');
  
  let notificationTitle = 'DevTools Test';
  let notificationOptions = {
    body: 'Test notification từ DevTools Push',
    icon: '/icon.png',
    badge: '/icon.png',
    data: {
      click_action: 'https://google.com',
      source: 'devtools'
    },
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Mở trang'
      }
    ]
  };
  
  // Xử lý data từ DevTools push
  if (event.data) {
    try {
      // Thử parse JSON trước
      const pushData = event.data.json();
      console.log('[PUSH] Push data (JSON):', pushData);
      
      // Xử lý notification object
      if (pushData.notification) {
        notificationTitle = pushData.notification.title || notificationTitle;
        notificationOptions.body = pushData.notification.body || notificationOptions.body;
        notificationOptions.icon = pushData.notification.icon || notificationOptions.icon;
        if (pushData.notification.click_action) {
          notificationOptions.data.click_action = pushData.notification.click_action;
        }
      }
      
      // Xử lý data object
      if (pushData.data) {
        notificationOptions.data = {
          ...notificationOptions.data,
          ...pushData.data
        };
        
        // Nếu có title/body trong data (cho silent push)
        if (pushData.data.title) notificationTitle = pushData.data.title;
        if (pushData.data.body) notificationOptions.body = pushData.data.body;
      }
      
    } catch (jsonError) {
      // Nếu không phải JSON, lấy text
      console.log('[PUSH] Not JSON, getting text:', event.data.text());
      const textData = event.data.text();
      if (textData) {
        notificationOptions.body = textData;
      }
    }
  }
  
  console.log('[PUSH] Showing notification:', notificationTitle, notificationOptions);
  
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Xử lý click notification - consolidate vào 1 listener
self.addEventListener('notificationclick', function(event) {
  console.log('[CLICK] Notification clicked:', event);
  
  event.notification.close();
  
  // Xử lý action buttons
  if (event.action) {
    console.log('[CLICK] Action clicked:', event.action);
    
    if (event.action === 'close') {
      return; // Chỉ đóng notification
    }
    
    if (event.action === 'open') {
      const clickAction = "https://google2.com";
      event.waitUntil(clients.openWindow(clickAction));
      return;
    }
  }

  // Click vào notification (không phải button)
  const clickAction = 'https://google2.com';
  console.log('[CLICK] Opening URL:', clickAction);
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      console.log('[CLICK] Found clients:', clientList.length);
      
      // Tìm tab đang mở cùng origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        console.log('[CLICK] Checking client:', client.url);
        
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('[CLICK] Navigating existing tab to:', clickAction);
          return client.focus().then(() => {
            // Navigate sau khi focus
            return client.navigate(clickAction);
          });
        }
      }
      
      // Nếu không có tab nào, mở tab mới
      if (clients.openWindow) {
        console.log('[CLICK] Opening new window:', clickAction);
        return clients.openWindow(clickAction);
      }
      
    }).catch(err => {
      console.error('[CLICK] Error handling notification click:', err);
      // Fallback: try to open new window anyway
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});

// Message handler cho communication với main thread
self.addEventListener('message', event => {
  console.log('[MESSAGE] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded successfully');
