try {
  // ... existing code ...
} catch (error: any) {
  // This first log might show 'error' as {} in some console summaries if it's not a standard Error object.
  console.error('Error during submission process. See details below:');

  // THE FOLLOWING LOGS ARE CRUCIAL. Check them in your browser's full developer console.
  if (error) {
    // For a 403 error from fetch, error.message might be "Failed to fetch"
    // or it might be a custom error object from your api.ts wrapper.
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Error Name:', error.name);

    // If 'error' is the Response object from a failed fetch, it might have status and statusText
    if (error.status && error.statusText) {
      console.error('Fetch Response Status:', error.status); // Should be 403
      console.error('Fetch Response Status Text:', error.statusText); // Should be "Forbidden"
    }

    // Attempt to log all properties of the error object
    try {
      const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error('Full Error Object (JSON, all properties):', errorDetails);
    } catch (stringifyError) {
      console.error('Full Error Object (raw, stringify failed):', error);
      console.error('Stringify Error:', stringifyError);
    }
  } else {
    console.error('Caught an undefined or null error object.');
  }

  // Your custom logging function
  // Ensure logError itself doesn't suppress details or cause further issues.
  if (typeof logError === 'function') {
    logError('Custom log: Error during submission process (details logged above in console)', error);
  }

  if (error instanceof BillingError) {
    // Delegate billing error handling
    console.log('Handling BillingError. Detail:', error.detail); // Using console.log for info
    if (typeof logInfo === 'function') {
      logInfo('Custom log: Handling BillingError:', error.detail); // Your custom info logger
    }
    // ... existing code ...
  }
}