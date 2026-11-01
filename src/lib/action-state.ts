/**
 * Shared contract for Server Action results consumed by `useActionState` forms.
 * Kept in `lib` so any feature can reuse it without importing another feature.
 */
export type ActionState =
  | {
      success: false;
      message?: string;
      errors?: Record<string, string[]>;
    }
    | {
      success: true;
      message?: string;
      /** Link whose raw token is shown exactly once (invite flow). */
      inviteUrl?: string;
    }
  | undefined;
