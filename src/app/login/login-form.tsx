'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/primitives';
import { login, type LoginState } from '@/server/actions/auth';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-muted">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="field"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'login-error' : undefined}
        />
      </label>
      {state.error ? (
        <p id="login-error" role="alert" className="text-sm font-medium text-bad">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
