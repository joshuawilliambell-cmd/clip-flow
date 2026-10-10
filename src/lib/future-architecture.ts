/**
 * Phase 3 hooks (not wired in the local prototype):
 *
 * - Auth: corporate SSO before production deploy
 * - Storage: private object storage + expiring signed URLs for uploads
 * - Render worker: async Remotion/@remotion/renderer jobs with job status
 * - Sharing: optional publish / embed hooks only if approved later
 */

export type RenderJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type RenderJob = {
  id: string;
  status: RenderJobStatus;
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
};
