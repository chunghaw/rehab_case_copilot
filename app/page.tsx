import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to cases page
  redirect('/cases');
}
