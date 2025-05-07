'use client';

export const generateThreadName = async (message: string): Promise<string> => {
  try {
    // For static export, just use a simple truncated version of the message
    const defaultName =
      message.trim().length > 50
        ? message.trim().substring(0, 47) + '...'
        : message.trim();
    
    const words = message.trim().split(/\s+/);
    const titleWords = words.slice(0, 3);
    const simpleTitle = titleWords.join(' ');
    
    // Return the simple title or default if empty
    return simpleTitle || defaultName;
  } catch (error) {
    console.error('Error generating thread name:', error);
    // Fall back to using a truncated version of the message
    return message.trim().length > 50
      ? message.trim().substring(0, 47) + '...'
      : message.trim();
  }
};
