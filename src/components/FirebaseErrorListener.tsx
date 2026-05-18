
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A central listener that catches FirestorePermissionErrors emitted by 
 * mutation calls or listeners. This triggers the Next.js development overlay 
 * with rich context for easier debugging of security rules.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // In development, this will trigger the error overlay
      // In production, you might want to log this to an error tracking service
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
