import { redirect } from 'next/navigation';

export default function AcheterRedirectPage() {
  redirect('/listing?type=SALE');
}
