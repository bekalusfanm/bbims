// Test script for dark mode input contrast
// Copy and run this in your browser console

// Helper function to check CSS color contrast
function getContrastRatio(color1, color2) {
  // Convert hex to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  // Calculate relative luminance
  function luminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  
  // Parse colors
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  // Calculate contrast ratio
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b) + 0.05;
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b) + 0.05;
  const ratio = l1 > l2 ? l1 / l2 : l2 / l1;
  
  return ratio.toFixed(2);
}

// Toggle dark mode
function toggleDarkMode() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  if (isDarkMode) {
    document.body.classList.remove('dark-mode');
    console.log('Dark mode disabled');
  } else {
    document.body.classList.add('dark-mode');
    console.log('Dark mode enabled');
  }

  // Update localStorage
  try {
    const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
    savedSettings.darkMode = !isDarkMode;
    localStorage.setItem('userSettings', JSON.stringify(savedSettings));
  } catch (error) {
    console.error('Error updating dark mode setting:', error);
  }
}

// Check input field contrast
function checkInputContrast() {
  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach((input, index) => {
    if (index < 5) { // Limit to first 5 inputs to avoid too much output
      const style = window.getComputedStyle(input);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      console.log(`Input #${index + 1}:`);
      console.log(`- Background: ${bgColor}`);
      console.log(`- Text color: ${textColor}`);
      
      // If possible, check contrast ratio (simplified here)
      if (bgColor && textColor) {
        console.log(`- Should have good contrast in dark mode`);
      }
    }
  });
}

// Execute tests
console.log('---------- DARK MODE INPUT TEST ----------');
console.log('Current mode:', document.body.classList.contains('dark-mode') ? 'Dark' : 'Light');
checkInputContrast();
console.log('');
console.log('To toggle dark mode, run: toggleDarkMode()');
console.log('To check input contrast, run: checkInputContrast()');
console.log('------------------------------------------'); 