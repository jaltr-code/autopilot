export class LeavePolicy {
  static canViewAllLeave(userRole: string): boolean {
    return userRole === 'ADMIN' || userRole === 'MANAGER';
  }

  static canApproveLeave(userRole: string): boolean {
    return userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'TEAM_LEAD';
  }
}