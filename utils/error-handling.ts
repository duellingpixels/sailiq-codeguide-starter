/**
 * SailIQ Error Handling Utilities
 *
 * Centralized error handling for the SailIQ application
 */

export class SailIQError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'SailIQError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Specific error types
export class ValidationError extends SailIQError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class AuthenticationError extends SailIQError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends SailIQError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends SailIQError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
  }
}

export class StorageError extends SailIQError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', 500, details);
  }
}

export class DatabaseError extends SailIQError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

export class AnalysisError extends SailIQError {
  constructor(message: string, details?: any) {
    super(message, 'ANALYSIS_ERROR', 500, details);
  }
}

export class FileUploadError extends SailIQError {
  constructor(message: string, details?: any) {
    super(message, 'FILE_UPLOAD_ERROR', 400, details);
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof SailIQError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details })
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('JWT')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token', code: 'INVALID_JWT' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error.message.includes('permission denied')) {
      return new Response(
        JSON.stringify({ error: 'Permission denied', code: 'PERMISSION_DENIED' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Unknown error
  return new Response(
    JSON.stringify({ error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Validate file upload parameters
 */
export function validateFileUpload(
  fileName: string,
  fileSize: number,
  fileType: string,
  maxSize: number = 5 * 1024 * 1024 * 1024 // 5GB
) {
  const errors: string[] = [];

  // File name validation
  if (!fileName || typeof fileName !== 'string') {
    errors.push('File name is required');
  }

  if (fileName.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }

  const allowedExtensions = ['.mp4', '.mov', '.avi'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
  }

  // File size validation
  if (typeof fileSize !== 'number' || fileSize <= 0) {
    errors.push('Invalid file size');
  }

  if (fileSize > maxSize) {
    errors.push(`File size exceeds limit of ${maxSize / (1024 * 1024 * 1024)}GB`);
  }

  // File type validation
  const allowedMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ];

  if (!allowedMimeTypes.includes(fileType)) {
    errors.push(`Invalid MIME type. Allowed: ${allowedMimeTypes.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new FileUploadError('File validation failed', { errors });
  }
}

/**
 * Validate session data
 */
export function validateSessionData(data: any) {
  const errors: string[] = [];

  // Required fields
  const requiredFields = ['title', 'session_type', 'boat_class'];
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  // Title validation
  if (data.title && data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  // Session type validation
  const allowedSessionTypes = ['training', 'race', 'regatta', 'practice'];
  if (data.session_type && !allowedSessionTypes.includes(data.session_type)) {
    errors.push(`Invalid session type. Allowed: ${allowedSessionTypes.join(', ')}`);
  }

  // Boat class validation
  const allowedBoatClasses = [
    'cadet', 'ilca_4', 'ilca_6', 'ilca_7', 'tasar', '29er', '420', 'other'
  ];
  if (data.boat_class && !allowedBoatClasses.includes(data.boat_class)) {
    errors.push(`Invalid boat class. Allowed: ${allowedBoatClasses.join(', ')}`);
  }

  // Numeric field validation
  const numericFields = [
    'duration_minutes',
    'wind_speed_knots',
    'wind_direction_degrees',
    'air_temperature_celsius',
    'water_temperature_celsius'
  ];

  for (const field of numericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = parseFloat(data[field]);
      if (isNaN(value)) {
        errors.push(`${field} must be a valid number`);
      } else {
        // Apply specific validation
        switch (field) {
          case 'duration_minutes':
            if (value < 1 || value > 480) {
              errors.push(`${field} must be between 1 and 480 minutes`);
            }
            break;
          case 'wind_speed_knots':
            if (value < 0 || value > 50) {
              errors.push(`${field} must be between 0 and 50 knots`);
            }
            break;
          case 'wind_direction_degrees':
            if (value < 0 || value > 360) {
              errors.push(`${field} must be between 0 and 360 degrees`);
            }
            break;
          case 'air_temperature_celsius':
            if (value < -10 || value > 50) {
              errors.push(`${field} must be between -10 and 50°C`);
            }
            break;
          case 'water_temperature_celsius':
            if (value < -5 || value > 40) {
              errors.push(`${field} must be between -5 and 40°C`);
            }
            break;
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Session validation failed', { errors });
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain error types
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const retryDelay = delay * Math.pow(backoff, attempt);
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${retryDelay}ms:`, lastError.message);

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError!;
}

/**
 * Create safe async handler that catches errors
 */
export function createSafeHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<{ data?: R; error?: SailIQError }> => {
    try {
      const data = await handler(...args);
      return { data };
    } catch (error) {
      if (error instanceof SailIQError) {
        return { error };
      }
      return {
        error: new SailIQError(
          error instanceof Error ? error.message : 'Unknown error',
          'UNKNOWN_ERROR'
        )
      };
    }
  };
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: (error as SailIQError).code,
    statusCode: (error as SailIQError).statusCode,
    details: (error as SailIQError).details,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('SailIQ Error:', JSON.stringify(errorData, null, 2));

  // In production, you might want to send this to a logging service
  // like Sentry, LogRocket, or Datadog
}