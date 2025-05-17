import AuthForm from '@/components/AuthForm';
import { Suspense } from 'react';

// Wrap the page content with Suspense to read searchParams
function SignupPageContent() {
  return <AuthForm mode="signup" />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
