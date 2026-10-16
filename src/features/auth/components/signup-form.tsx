"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type ActionState } from "../actions";

export function SignupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    signupAction,
    undefined,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Crea tu cuenta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              name="name"
              placeholder="Carlos Pereyra"
              required
            />
            {state?.success === false && state.errors?.name ? (
              <p className="text-sm text-destructive">
                {state.errors.name[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@inmobiliaria.com"
              required
            />
            {state?.success === false && state.errors?.email ? (
              <p className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
            {state?.success === false && state.errors?.password ? (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Repetí tu contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
            {state?.success === false && state.errors?.confirmPassword ? (
              <p className="text-sm text-destructive">
                {state.errors.confirmPassword[0]}
              </p>
            ) : null}
          </div>

          {state?.success === false && state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
