/**
 * Phase 3 hooks (not wired in the local prototype):
 *
 * - Auth: corporate SSO before production deploy
 * - Storage: private object storage + expiring signed URLs for uploads
 * - Render worker: async Remotion/@remotion/renderer jobs with job status
 * - Allego: link-based access first; embedding / auto-publish only if approved
 *
 * Do not gate access solely on an Allego referring URL.
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
