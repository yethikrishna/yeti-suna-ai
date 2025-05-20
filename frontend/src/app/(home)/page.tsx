import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/auth');
  // This part will not be reached because redirect throws an error to stop rendering
  return null;
}
