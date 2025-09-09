importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDHgZwBkp2syivHbLWM6Tgu3UoDBAQB8r0",
  authDomain: "smartonetestnoti.firebaseapp.com",
  projectId: "smartonetestnoti",
  storageBucket: "smartonetestnoti.appspot.com",
  messagingSenderId: "419243653443",
  appId: "1:419243653443:web:26348d8c428f2688c8d7f6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
