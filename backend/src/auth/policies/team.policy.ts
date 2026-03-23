export class TeamPolicy {
  static canManageTeam(
    userRole: string,
    managedTeamIds: string[],
    teamId: string,
  ): boolean {
    if (userRole === 'ADMIN') {
      return true;
    }

    if (userRole === 'MANAGER') {
      return true;
    }

    if (userRole === 'TEAM_LEAD' && managedTeamIds.includes(teamId)) {
      return true;
    }

    return false;
  }
}