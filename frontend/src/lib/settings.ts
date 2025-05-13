// Define the structure for application settings
export interface AppSettings {
  openaiApiKey: string;
  openaiModelName: string;
  geminiApiKey: string;
  geminiModelName: string;
  anthropicApiKey: string;
  anthropicModelName: string;
  openrouterApiKey: string;
  openrouterModelName: string;

  tavilyApiKey: string;
  firecrawlApiKey: string;
  perplexityApiKey: string;
  rapidApiKey: string;

  // Add other settings as needed in the future
}

const SETTINGS_STORAGE_KEY = 'sunaAppSettings';

// Function to save settings to localStorage
export const saveSettings = (settings: AppSettings): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        // console.log('Settings saved:', settings);
        resolve();
      } else {
        throw new Error('localStorage is not available');
      }
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      reject(error);
    }
  });
};

// Function to load settings from localStorage
export const loadSettings = (): AppSettings | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as AppSettings;
        // console.log('Settings loaded:', parsedSettings);
        return parsedSettings;
      } else {
        // console.log('No settings found in localStorage.');
        return null; // No settings saved yet
      }
    } else {
      // console.warn('localStorage is not available, cannot load settings.');
      return null;
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    // If parsing fails, remove the corrupted item
    if (typeof window !== 'undefined' && window.localStorage) {
       localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
    return null;
  }
}; 