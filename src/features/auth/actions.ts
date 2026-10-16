"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { memberships, organizations, sessions, users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";
import { requireUser } from "@/lib/dal";
import { loginSchema, signupSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export type { ActionState } from "@/lib/action-state";

export async function signupAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return {
      success: false,
      message: "Ya existe una cuenta con ese correo electrónico",
    };
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ name, email: email.toLowerCase(), passwordHash })
    .returning({ id: users.id });

  // Create default organization (tenant) for the new user
  const orgName = `${name.split(" ")[0] || "Mi"} Inmobiliaria`;
  const baseSlug = orgName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${user.id.slice(0, 8)}`;

  const [org] = await db
    .insert(organizations)
    .values({ name: orgName, slug })
    .returning({ id: organizations.id });

  await db.insert(memberships).values({
    userId: user.id,
    organizationId: org.id,
    role: "owner",
  });

  await createSession(user.id, org.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return {
      success: false,
      message: "Credenciales inválidas",
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return {
      success: false,
      message: "Credenciales inválidas",
    };
  }

  const [membership] = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .orderBy(memberships.createdAt)
    .limit(1);

  const activeOrgId = membership?.organizationId ?? null;

  await createSession(user.id, activeOrgId);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  revalidatePath("/");
  redirect("/login");
}

export async function switchOrganizationAction(
  organizationId: string,
): Promise<void> {
  const user = await requireUser();

  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, user.id),
        eq(memberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    return;
  }

  await db
    .update(sessions)
    .set({ activeOrganizationId: organizationId })
    .where(eq(sessions.id, user.sessionId));

  revalidatePath("/dashboard");
}
