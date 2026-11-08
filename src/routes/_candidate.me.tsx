import { createFileRoute } from '@tanstack/react-router';
import { CandidateShell } from '@/components/careers/CandidateDashboard';
export const Route=createFileRoute('/_candidate/me')({component:CandidateShell});