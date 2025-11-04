import { createClient } from "@supabase/supabase-js"
import { toDateTime } from '@/utils/helpers';
import { stripe } from '@/utils/stripe/config';
import Stripe from 'stripe';
import type { Database, Tables, TablesInsert } from '@/types/database.types';

export function createAdminClient() {
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    return supabase
}


type Product = Tables<'products'>;
type Price = Tables<'prices'>;

// Change to control trial period length
const TRIAL_PERIOD_DAYS = 0;

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a secure server-side context
// as it has admin privileges and overwrites RLS policies!
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const upsertProductRecord = async (product: Stripe.Product) => {
    const productData: Product = {
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description ?? null,
        image: product.images?.[0] ?? null,
        metadata: product.metadata,
        marketing_features: product.marketing_features.map(m => m.name || "") ?? [],
        live_mode: product.livemode
    };

    const { error: upsertError } = await supabaseAdmin
        .from('products')
        .upsert([productData]);
    if (upsertError)
        throw new Error(`Product insert/update failed: ${upsertError.message}`);
    console.log(`Product inserted/updated: ${product.id}`);
};

const upsertPriceRecord = async (
    price: Stripe.Price,
    retryCount = 0,
    maxRetries = 3
) => {
    const priceData: Price = {
        id: price.id,
        product_id: typeof price.product === 'string' ? price.product : '',
        active: price.active,
        currency: price.currency,
        type: price.type,
        unit_amount: price.unit_amount ?? null,
        interval: price.recurring?.interval ?? null,
        interval_count: price.recurring?.interval_count ?? null,
        trial_period_days: price.recurring?.trial_period_days ?? TRIAL_PERIOD_DAYS,
        description: "",
        metadata: {}
    };

    const { error: upsertError } = await supabaseAdmin
        .from('prices')
        .upsert([priceData]);

    if (upsertError?.message.includes('foreign key constraint')) {
        if (retryCount < maxRetries) {
            console.log(`Retry attempt ${retryCount + 1} for price ID: ${price.id}`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await upsertPriceRecord(price, retryCount + 1, maxRetries);
        } else {
            throw new Error(
                `Price insert/update failed after ${maxRetries} retries: ${upsertError.message}`
            );
        }
    } else if (upsertError) {
        throw new Error(`Price insert/update failed: ${upsertError.message}`);
    } else {
        console.log(`Price inserted/updated: ${price.id}`);
    }
};

const deleteProductRecord = async (product: Stripe.Product) => {
    const { error: deletionError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', product.id);
    if (deletionError)
        throw new Error(`Product deletion failed: ${deletionError.message}`);
    console.log(`Product deleted: ${product.id}`);
};

const deletePriceRecord = async (price: Stripe.Price) => {
    const { error: deletionError } = await supabaseAdmin
        .from('prices')
        .delete()
        .eq('id', price.id);
    if (deletionError) throw new Error(`Price deletion failed: ${deletionError.message}`);
    console.log(`Price deleted: ${price.id}`);
};

const upsertCustomerToSupabase = async (uuid: string, customerId: string) => {
    const { error: upsertError } = await supabaseAdmin
        .from('customers')
        .upsert([{ id: uuid, stripe_customer_id: customerId }]);

    if (upsertError)
        throw new Error(`Supabase customer record creation failed: ${upsertError.message}`);

    return customerId;
};

const createCustomerInStripe = async (uuid: string, email: string, referral?: string) => {
    const customerData: Stripe.CustomerCreateParams = { metadata: { supabaseUUID: uuid, referral: referral || null }, email: email };
    const newCustomer = await stripe.customers.create(customerData);
    if (!newCustomer) throw new Error('Stripe customer creation failed.');

    return newCustomer.id;
};

const createOrRetrieveCustomer = async ({
    email,
    uuid,
    referral
}: {
    email: string;
    uuid: string;
    referral?: string
}) => {
    // Check if the customer already exists in Supabase
    const { data: existingSupabaseCustomer, error: queryError } =
        await supabaseAdmin
            .from('customers')
            .select('*')
            .eq('id', uuid)
            .maybeSingle();

    if (queryError) {
        throw new Error(`Supabase customer lookup failed: ${queryError.message}`);
    }

    // Retrieve the Stripe customer ID using the Supabase customer ID, with email fallback
    let stripeCustomerId: string | undefined;
    if (existingSupabaseCustomer?.stripe_customer_id) {
        const existingStripeCustomer = await stripe.customers.retrieve(
            existingSupabaseCustomer.stripe_customer_id
        );
        stripeCustomerId = existingStripeCustomer.id;
    } else {
        // If Stripe ID is missing from Supabase, try to retrieve Stripe customer ID by email
        const stripeCustomers = await stripe.customers.list({ email: email });
        stripeCustomerId =
            stripeCustomers.data.length > 0 ? stripeCustomers.data[0].id : undefined;
    }

    // If still no stripeCustomerId, create a new customer in Stripe
    const stripeIdToInsert = stripeCustomerId
        ? stripeCustomerId
        : await createCustomerInStripe(uuid, email, referral);
    if (!stripeIdToInsert) throw new Error('Stripe customer creation failed.');

    if (existingSupabaseCustomer && stripeCustomerId) {
        // If Supabase has a record but doesn't match Stripe, update Supabase record
        if (existingSupabaseCustomer.stripe_customer_id !== stripeCustomerId) {
            const { error: updateError } = await supabaseAdmin
                .from('customers')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', uuid);

            if (updateError)
                throw new Error(
                    `Supabase customer record update failed: ${updateError.message}`
                );
            console.warn(
                `Supabase customer record mismatched Stripe ID. Supabase record updated.`
            );
        }
        // If Supabase has a record and matches Stripe, return Stripe customer ID
        return stripeCustomerId;
    } else {
        console.warn(
            `Supabase customer record was missing. A new record was created.`
        );

        // If Supabase has no record, create a new record and return Stripe customer ID
        const upsertedStripeCustomer = await upsertCustomerToSupabase(
            uuid,
            stripeIdToInsert
        );
        if (!upsertedStripeCustomer)
            throw new Error('Supabase customer record creation failed.');

        return upsertedStripeCustomer;
    }
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
const copyBillingDetailsToCustomer = async (
    uuid: string,
    payment_method: Stripe.PaymentMethod
) => {
    //Todo: check this assertion
    const customer = payment_method.customer as string;
    const { name, phone, address } = payment_method.billing_details;
    if (!name || !phone || !address) return;
    //@ts-ignore
    await stripe.customers.update(customer, { name, phone, address });
};

const manageSubscriptionStatusChange = async (
    subscriptionId: string,
    customerId: string,
    createAction = false
) => {
    // Get customer's UUID from mapping table.
    const { data: customerData, error: noCustomerError } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (noCustomerError)
        throw new Error(`Customer lookup failed: ${noCustomerError.message}`);

    const { id: uuid } = customerData!;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method']
    });
    // Upsert the latest status of the subscription object.
    const subscriptionData: TablesInsert<'subscriptions'> = {
        id: subscription.id,
        user_id: uuid,
        metadata: subscription.metadata,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        //TODO check quantity on subscription
        // @ts-ignore
        quantity: subscription.quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at
            ? toDateTime(subscription.cancel_at).toISOString()
            : null,
        canceled_at: subscription.canceled_at
            ? toDateTime(subscription.canceled_at).toISOString()
            : null,
        current_period_start: toDateTime(
            subscription.current_period_start
        ).toISOString(),
        current_period_end: toDateTime(
            subscription.current_period_end
        ).toISOString(),
        created: toDateTime(subscription.created).toISOString(),
        ended_at: subscription.ended_at
            ? toDateTime(subscription.ended_at).toISOString()
            : null,
        trial_start: subscription.trial_start
            ? toDateTime(subscription.trial_start).toISOString()
            : null,
        trial_end: subscription.trial_end
            ? toDateTime(subscription.trial_end).toISOString()
            : null
    };

    const { error: upsertError } = await supabaseAdmin
        .from('subscriptions')
        .upsert([subscriptionData]);
    if (upsertError)
        throw new Error(`Subscription insert/update failed: ${upsertError.message}`);
    console.log(
        `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`
    );

    // For a new subscription copy the billing details to the customer object.
    // NOTE: This is a costly operation and should happen at the very end.
    if (createAction && subscription.default_payment_method && uuid)
        //@ts-ignore
        await copyBillingDetailsToCustomer(
            uuid,
            subscription.default_payment_method as Stripe.PaymentMethod
        );
};

/**
 * Initialize SailIQ storage buckets for video uploads
 */
export const initializeStorageBuckets = async () => {
    const buckets = [
        {
            name: 'sailing-videos',
            options: {
                public: false,
                allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
                fileSizeLimit: 5 * 1024 * 1024 * 1024, // 5GB
            }
        },
        {
            name: 'video-clips',
            options: {
                public: false,
                allowedMimeTypes: ['video/mp4', 'video/webm'],
                fileSizeLimit: 500 * 1024 * 1024, // 500MB
            }
        },
        {
            name: 'thumbnails',
            options: {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                fileSizeLimit: 10 * 1024 * 1024, // 10MB
            }
        }
    ];

    for (const bucket of buckets) {
        try {
            // Check if bucket exists
            const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
            const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

            if (!bucketExists) {
                const { error } = await supabaseAdmin.storage.createBucket(
                    bucket.name,
                    bucket.options
                );

                if (error) {
                    console.error(`Failed to create bucket ${bucket.name}:`, error);
                    throw error;
                }

                console.log(`Created storage bucket: ${bucket.name}`);
            } else {
                console.log(`Storage bucket already exists: ${bucket.name}`);
            }
        } catch (error) {
            console.error(`Error setting up bucket ${bucket.name}:`, error);
            throw error;
        }
    }
};

/**
 * Delete a video file and its associated files from storage
 */
export const deleteVideoFromStorage = async (filePath: string, sessionId?: string) => {
    try {
        // Delete main video file
        const { error: videoError } = await supabaseAdmin.storage
            .from('sailing-videos')
            .remove([filePath]);

        if (videoError) {
            console.error('Failed to delete video file:', videoError);
        }

        // Delete associated clips if sessionId is provided
        if (sessionId) {
            const { data: clips } = await supabaseAdmin.storage
                .from('video-clips')
                .list(sessionId);

            if (clips && clips.length > 0) {
                const clipPaths = clips.map(clip => `${sessionId}/${clip.name}`);
                const { error: clipsError } = await supabaseAdmin.storage
                    .from('video-clips')
                    .remove(clipPaths);

                if (clipsError) {
                    console.error('Failed to delete video clips:', clipsError);
                }
            }

            // Delete thumbnails
            const { data: thumbnails } = await supabaseAdmin.storage
                .from('thumbnails')
                .list(sessionId);

            if (thumbnails && thumbnails.length > 0) {
                const thumbnailPaths = thumbnails.map(thumb => `${sessionId}/${thumb.name}`);
                const { error: thumbsError } = await supabaseAdmin.storage
                    .from('thumbnails')
                    .remove(thumbnailPaths);

                if (thumbsError) {
                    console.error('Failed to delete thumbnails:', thumbsError);
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting video from storage:', error);
        return { success: false, error };
    }
};

/**
 * Generate a public URL for a thumbnail
 */
export const getPublicThumbnailUrl = (sessionId: string, filename: string) => {
    const { data } = supabaseAdmin.storage
        .from('thumbnails')
        .getPublicUrl(`${sessionId}/${filename}`);

    return data.publicUrl;
};

/**
 * Update analysis job status and progress
 */
export const updateAnalysisJob = async (
    jobId: string,
    updates: {
        status?: Database['public']['Enums']['analysis_status'];
        progress_percentage?: number;
        current_step?: string;
        error_message?: string;
        processing_started_at?: string;
        processing_completed_at?: string;
        estimated_completion?: string;
    }
) => {
    try {
        const { error } = await supabaseAdmin
            .from('analysis_jobs')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating analysis job:', error);
        return { success: false, error };
    }
};

/**
 * Get session statistics for admin dashboard
 */
export const getSessionStatistics = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('sailing_sessions')
            .select(`
                id,
                user_id,
                boat_class,
                session_type,
                analysis_status,
                video_file_size,
                created_at
            `);

        if (error) {
            throw error;
        }

        const stats = {
            totalSessions: data?.length || 0,
            totalUsers: new Set(data?.map(s => s.user_id)).size,
            totalVideoSize: data?.reduce((acc, s) => acc + (s.video_file_size || 0), 0) || 0,
            sessionsByStatus: {} as Record<string, number>,
            sessionsByBoatClass: {} as Record<string, number>,
            sessionsByType: {} as Record<string, number>,
        };

        // Calculate breakdowns
        data?.forEach(session => {
            stats.sessionsByStatus[session.analysis_status] =
                (stats.sessionsByStatus[session.analysis_status] || 0) + 1;
            stats.sessionsByBoatClass[session.boat_class] =
                (stats.sessionsByBoatClass[session.boat_class] || 0) + 1;
            stats.sessionsByType[session.session_type] =
                (stats.sessionsByType[session.session_type] || 0) + 1;
        });

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error getting session statistics:', error);
        return { success: false, error };
    }
};

export {
    upsertProductRecord,
    upsertPriceRecord,
    deleteProductRecord,
    deletePriceRecord,
    createOrRetrieveCustomer,
    manageSubscriptionStatusChange,
    initializeStorageBuckets,
    deleteVideoFromStorage,
    getPublicThumbnailUrl,
    updateAnalysisJob,
    getSessionStatistics,
};
