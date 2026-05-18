import React from 'react';
import AuthScreen from '@/app/sign-up-login-screen/components/AuthScreen';
import ClientOnly from '@/components/ClientOnly';

export default function SignUpLoginPage() {
  return (
    <ClientOnly>
      <AuthScreen />
    </ClientOnly>
  );
}
