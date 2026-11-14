import type * as React from 'react';

import { AuthCard } from '../../../components/forms/auth-card';

export default function RegisterPage(): React.JSX.Element {
  return <AuthCard initialMode="register" />;
}
