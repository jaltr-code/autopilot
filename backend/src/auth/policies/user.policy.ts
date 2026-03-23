export class UserPolicy {
  static canViewAllUsers(userRole: string): boolean {
    return userRole === 'ADMIN' || userRole === 'MANAGER';
  }

  static canViewSpecificUser(
    currentUserRole: string,
    currentUserId: string,
    targetUserId: string,
    sharedManagedTeam: boolean,
  ): boolean {
    if (currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER') {
      return true;
    }

    if (currentUserRole === 'TEAM_LEAD' && sharedManagedTeam) {
      return true;
    }

    if (currentUserRole === 'STAFF' && currentUserId === targetUserId) {
      return true;
    }

    return false;
  }
}