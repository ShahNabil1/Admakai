import { createFileRoute } from '@tanstack/react-router';
import { ClientShell } from '@/components/client/ClientShell';
export const Route=createFileRoute('/_authenticated/app')({component:ClientShell});
