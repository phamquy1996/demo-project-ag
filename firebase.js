console.log('Service Worker loaded');

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
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Test push event handler (cho DevTools test)
self.addEventListener('push', function(event) {
  console.log('Push event received in service worker');
  
  let notificationTitle = 'Test Notification';
  let notificationOptions = {
    body: 'This is a test notification from Service Worker',
    icon: '/icon.png'
  };
  
  if (event.data) {
    try {
      // Thử parse JSON trước
      const data = event.data.json();
      console.log('Push data (JSON):', data);
      
      notificationTitle = data.title || notificationTitle;
      notificationOptions.body = data.body || notificationOptions.body;
      notificationOptions.icon = data.icon || notificationOptions.icon;
      
    } catch (jsonError) {
      // Nếu không phải JSON, lấy text
      console.log('Not JSON, getting text:', event.data.text());
      notificationOptions.body = event.data.text() || 'Test from DevTools';
    }
  }
  
  console.log('Showing notification:', notificationTitle, notificationOptions);
  
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

console.log('Service Worker setup complete');
