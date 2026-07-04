import { redirect } from 'next/navigation';

export default function LouerRedirectPage() {
  redirect('/listing?type=RENT');
}
