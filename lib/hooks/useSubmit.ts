import { useCallback, useRef, useState } from "react";

export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const lockedRef = useRef(false);

  const withSubmit = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current) return undefined;
    lockedRef.current = true;
    setSubmitting(true);
    try {
      return await fn();
    } finally {
      lockedRef.current = false;
      setSubmitting(false);
    }
  }, []);

  return { submitting, withSubmit };
}

export function useActionLoading() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const lockedRef = useRef<Set<string>>(new Set());

  const withAction = useCallback(async <T>(id: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current.has(id)) return undefined;
    lockedRef.current.add(id);
    setActionLoading(id);
    try {
      return await fn();
    } finally {
      lockedRef.current.delete(id);
      setActionLoading((prev) => (prev === id ? null : prev));
    }
  }, []);

  return { actionLoading, withAction };
}
