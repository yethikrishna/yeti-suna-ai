// ... other imports ...
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api'; // Example

export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
// ... existing code ...
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api'; // Example
export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
// ... existing code ...