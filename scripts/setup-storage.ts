#!/usr/bin/env tsx

/**
 * SailIQ Storage Setup Script
 *
 * This script initializes the Supabase storage buckets needed for SailIQ.
 * Run this script after setting up your Supabase project and running the migrations.
 */

import { createClient } from '@supabase/supabase-js';
import { initializeStorageBuckets } from '../utils/supabase/admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupStorage() {
  try {
    console.log('🚀 Starting SailIQ storage setup...\n');

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables:');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    console.log('✅ Environment variables validated');

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Test connection
    console.log('🔗 Testing Supabase connection...');
    const { data, error } = await supabaseAdmin.from('sailing_sessions').select('count');
    if (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
    console.log('✅ Supabase connection successful');

    // Initialize storage buckets
    console.log('\n📦 Initializing storage buckets...');
    await initializeStorageBuckets();
    console.log('✅ Storage buckets initialized successfully');

    // Verify buckets exist
    console.log('\n🔍 Verifying bucket setup...');
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();

    const requiredBuckets = ['sailing-videos', 'video-clips', 'thumbnails'];
    const foundBuckets = buckets?.map(b => b.name) || [];

    for (const bucketName of requiredBuckets) {
      if (foundBuckets.includes(bucketName)) {
        console.log(`✅ Bucket '${bucketName}' exists`);
      } else {
        throw new Error(`❌ Bucket '${bucketName}' not found`);
      }
    }

    console.log('\n🎉 SailIQ storage setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Created storage buckets for videos, clips, and thumbnails');
    console.log('- Configured appropriate file size limits and MIME types');
    console.log('- Set up bucket permissions');
    console.log('\n✨ You can now start uploading sailing sessions!');

  } catch (error) {
    console.error('\n❌ Storage setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupStorage();
}

export { setupStorage };