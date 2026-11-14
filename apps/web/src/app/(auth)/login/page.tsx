import type * as React from 'react';

import { AuthCard } from '../../../components/forms/auth-card';

export default function LoginPage(): React.JSX.Element {
  return <AuthCard initialMode="login" />;
}
