import { createClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB for GoPro videos
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi'];
const BUCKET_NAME = 'sailing-videos';

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { fileName, fileSize, fileType } = body;

    // Validate input
    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileSize, fileType' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
          allowedExtensions: ALLOWED_EXTENSIONS
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`,
          maxSize: MAX_FILE_SIZE
        },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileId = randomUUID();
    const filePath = `${userId}/${fileId}/${fileName}`;

    // Get Supabase client
    const supabase = createClient();

    // Generate presigned URL for upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath, {
        expiresIn: 3600, // 1 hour
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    // Return upload URL and metadata
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      filePath: filePath,
      fileId: fileId,
      bucketName: BUCKET_NAME,
      expiresIn: 3600,
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}