import type { TeamMember } from "@prisma/client";
import { TEAM_MEMBER_ORDER, TEAM_MEMBER_LABELS } from "@/lib/status-config";

/**
 * The 5 named team members contacts/tasks can be assigned to. Replaces the
 * earlier 100 placeholder sending-account emails, which represented
 * outreach mailboxes rather than people — see CLAUDE.md for the migration
 * rationale.
 */
export const TEAM_MEMBERS: TeamMember[] = TEAM_MEMBER_ORDER;

export function teamMemberLabel(member: TeamMember): string {
  return TEAM_MEMBER_LABELS[member];
}
