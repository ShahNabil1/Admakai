export type ProblemStat = { value: string; caption: string; sourceLabel: string; sourceUrl: string };
export type ServiceProof = { problemStat?: ProblemStat };
// Only owner-supplied, verifiable proof belongs here. No sample statistics or reviews.
export const proof: Record<string, ServiceProof> = {};