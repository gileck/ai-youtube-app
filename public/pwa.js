// This script is used to register the service worker

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
