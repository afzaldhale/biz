import { toast } from 'sonner';

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null) {
    const maybeCode = (error as { code?: unknown }).code;
    if (typeof maybeCode === 'string') {
      return maybeCode;
    }
  }

  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  return String(error ?? 'Unknown error');
}

function getFriendlyErrorMessage(error: unknown, fallbackMessage?: string): string {
  const originalMessage = getErrorMessage(error);
  const lowercased = originalMessage.toLowerCase();
  const code = getErrorCode(error)?.toLowerCase() ?? '';

  if (code.includes('permission-denied') || lowercased.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }

  if (
    code.includes('not-found') ||
    lowercased.includes('not found') ||
    lowercased.includes('document does not exist') ||
    lowercased.includes('no such document')
  ) {
    return 'Unable to find the requested data. Please refresh and try again.';
  }

  if (
    code.includes('unavailable') ||
    lowercased.includes('network') ||
    lowercased.includes('offline') ||
    lowercased.includes('failed to fetch') ||
    lowercased.includes('network request failed')
  ) {
    return 'Unable to reach the server. Check your internet connection and try again.';
  }

  if (
    lowercased.includes('timeout') ||
    lowercased.includes('deadline-exceeded') ||
    lowercased.includes('service unavailable')
  ) {
    return 'The service is temporarily unavailable. Please try again shortly.';
  }

  if (lowercased.includes('quota') || lowercased.includes('resource-exhausted')) {
    return 'You have reached a usage limit. Please refresh or contact support.';
  }

  if (lowercased.includes('email-already-in-use')) {
    return 'That email is already in use. Please sign in or use a different email.';
  }

  if (lowercased.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }

  if (lowercased.includes('wrong-password') || lowercased.includes('invalid-password')) {
    return 'The credentials do not match our records. Please try again.';
  }

  return fallbackMessage ?? 'Something went wrong. Please try again.';
}

export function getAppErrorMessage(error: unknown, fallbackMessage?: string): string {
  return getFriendlyErrorMessage(error, fallbackMessage);
}

export function handleAppError(error: unknown, fallbackMessage?: string): string {
  const friendlyMessage = getFriendlyErrorMessage(error, fallbackMessage);
  console.error('[app-error]', error);
  toast.error(friendlyMessage, { duration: 5000 });
  return friendlyMessage;
}
