// Test if @testing-library/jest-dom can be imported correctly
try {
  require('@testing-library/jest-dom');
  console.log('✓ @testing-library/jest-dom imported successfully');
} catch (error) {
  console.log('✗ Failed to import @testing-library/jest-dom:', error.message);
}

// Check if jest globals are available
try {
  const { expect } = require('@jest/globals');
  console.log('✓ @jest/globals imported successfully');
  
  // Check if matchers are available
  if (expect.extend && typeof expect.extend === 'function') {
    console.log('✓ expect.extend is available');
  } else {
    console.log('✗ expect.extend is not available');
  }
} catch (error) {
  console.log('✗ Failed to import @jest/globals:', error.message);
}
