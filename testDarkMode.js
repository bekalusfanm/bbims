// This script will manually enable dark mode in localStorage to test functionality
// Then you can check if it works when you start the application

// Enable dark mode in localStorage
localStorage.setItem('userSettings', JSON.stringify({
  darkMode: true,
  notifications: true,
  language: 'en'
}));

// Check if dark mode is enabled
const settings = JSON.parse(localStorage.getItem('userSettings'));
console.log('Dark mode is ' + (settings.darkMode ? 'enabled' : 'disabled'));

// Apply dark mode to body
if (settings.darkMode) {
  document.body.classList.add('dark-mode');
} else {
  document.body.classList.remove('dark-mode');
}

// Log the result
console.log('Dark mode class ' + (document.body.classList.contains('dark-mode') ? 'has been applied' : 'is not applied') + ' to body element'); 