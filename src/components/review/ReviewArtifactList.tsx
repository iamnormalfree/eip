// ABOUTME: Review Artifact List Component - Lists all draft artifacts for review
// ABOUTME: Displays artifact cards with content preview and review actions

import { Database } from '../../../lib_supabase/db/types/database.types';
import { ReviewArtifactCard } from './ReviewArtifactCard';

type EipArtifact = Database['public']['Tables']['eip_artifacts']['Row'];

interface ReviewArtifactListProps {
  artifacts: EipArtifact[];
}

export function ReviewArtifactList({ artifacts }: ReviewArtifactListProps) {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Artifacts to Review</h3>
        <p className="text-gray-500">All artifacts have been reviewed. Check back later for new content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Review Queue</h2>
        <div className="text-sm text-gray-500">
          Showing {artifacts.length} artifact{artifacts.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-4">
        {artifacts.map((artifact) => (
          <ReviewArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </div>
  );
}