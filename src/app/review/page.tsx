// ABOUTME: Review UI Server Component - Lists draft artifacts for human review
// ABOUTME: Implements approval workflow for EIP content generation quality gates

import { getSupabaseAdmin } from '../../../lib_supabase/db/supabase-client';
import { Database } from '../../../lib_supabase/db/types/database.types';
import { ReviewArtifactList } from '../../../components/review/ReviewArtifactList';
import { ReviewHeader } from '../../../components/review/ReviewHeader';

type EipArtifact = Database['public']['Tables']['eip_artifacts']['Row'];

// Server component to fetch and display draft artifacts
export default async function ReviewPage() {
  const supabase = getSupabaseAdmin();

  // Fetch only draft artifacts for review
  const { data: artifacts, error } = await supabase
    .from('eip_artifacts')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching draft artifacts:', error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Review Queue</h1>
        <p className="text-gray-600">Failed to fetch artifacts for review. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <ReviewHeader artifactCount={artifacts?.length || 0} />
      <ReviewArtifactList artifacts={artifacts || []} />
    </div>
  );
}