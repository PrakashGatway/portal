importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");


firebase.initializeApp({
  apiKey: "AIzaSyDhllsJ3c29AaoW6_E1FB1ta3HBAD4O5oY",
  authDomain: "ooshasprep-d3a3d.firebaseapp.com",
  projectId: "ooshasprep-d3a3d",
  storageBucket: "ooshasprep-d3a3d.firebasestorage.app",
  messagingSenderId: "371957412702",
  appId: "1:371957412702:web:9a209bb514bc69f0f195cf",
  measurementId: "G-CGJREFJKRK"
});


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/ooshas-logo.png",
    data: payload.data, // so you can use it in notificationclick
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: handle clicks on the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.openWindow(url)
  );
});


// importScripts(
//   "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
// );

// importScripts(
//   "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
// );

// firebase.initializeApp({
//   apiKey: "AIzaSyDhllsJ3c29AaoW6_E1FB1ta3HBAD4O5oY",
//   authDomain: "ooshasprep-d3a3d.firebaseapp.com",
//   projectId: "ooshasprep-d3a3d",
//   storageBucket: "ooshasprep-d3a3d.firebasestorage.app",
//   messagingSenderId: "371957412702",
//   appId: "1:371957412702:web:9a209bb514bc69f0f195cf",
//   measurementId: "G-CGJREFJKRK"
// });

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   console.log("Background message:", payload);

//   const title =
//     payload.notification?.title || "New Notification";

//   const options = {
//     body: payload.notification?.body || "",
//     icon: "/ooshas-logo.png",
//     data: payload.data || {},
//   };

//   self.registration.showNotification(title, options);
// });
