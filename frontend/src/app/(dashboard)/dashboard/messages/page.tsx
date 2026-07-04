import { Suspense } from 'react';
import MessagesPageContent from './messages-content';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
  return (
    <div className="flex h-[calc(100vh-100px)] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MessagesPageContent />
    </Suspense>
  );
}
