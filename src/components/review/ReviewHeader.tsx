// ABOUTME: Review Header Component - Displays review queue status and quality gate info
// ABOUTME: Shows count of artifacts awaiting human review

interface ReviewHeaderProps {
  artifactCount: number;
}

export function ReviewHeader({ artifactCount }: ReviewHeaderProps) {
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Review</h1>
            <p className="text-gray-600 mt-1">
              Human review queue for EIP content generation quality gates
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{artifactCount}</div>
            <div className="text-sm text-gray-500">Artifacts Awaiting Review</div>
          </div>
        </div>
      </div>

      {/* Quality Gate Status */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">IP Invariants</h3>
              <p className="text-sm text-green-600">Validated by orchestrator</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Compliance Rules</h3>
              <p className="text-sm text-blue-600">Checked by micro-auditor</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Human Review</h3>
              <p className="text-sm text-yellow-600">Pending your approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}