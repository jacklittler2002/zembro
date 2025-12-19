export interface UserPreferencesInput {
    emailNotifications?: boolean;
    campaignNotifications?: boolean;
    leadSearchNotifications?: boolean;
    theme?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    language?: string;
}
/**
 * Get or create user preferences
 */
export declare function getUserPreferences(userId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    timezone: string;
    emailNotifications: boolean;
    campaignNotifications: boolean;
    leadSearchNotifications: boolean;
    theme: string;
    dateFormat: string;
    currency: string;
    language: string;
}>;
/**
 * Update user preferences
 */
export declare function updateUserPreferences(userId: string, input: UserPreferencesInput): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    timezone: string;
    emailNotifications: boolean;
    campaignNotifications: boolean;
    leadSearchNotifications: boolean;
    theme: string;
    dateFormat: string;
    currency: string;
    language: string;
}>;
/**
 * Create a notification for a user
 */
export declare function createNotification(userId: string, type: string, title: string, message: string, data?: any): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    type: import(".prisma/client").$Enums.NotificationType;
    title: string;
    message: string;
    data: import("@prisma/client/runtime/client").JsonValue | null;
    isRead: boolean;
}>;
/**
 * Get user notifications
 */
export declare function getUserNotifications(userId: string, limit?: number, offset?: number): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    type: import(".prisma/client").$Enums.NotificationType;
    title: string;
    message: string;
    data: import("@prisma/client/runtime/client").JsonValue | null;
    isRead: boolean;
}[]>;
/**
 * Mark notification as read
 */
export declare function markNotificationRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Mark all notifications as read for a user
 */
export declare function markAllNotificationsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
/**
 * Get unread notification count
 */
export declare function getUnreadNotificationCount(userId: string): Promise<number>;
/**
 * Create an audit log entry
 */
export declare function createAuditLog(userId: string | undefined, action: string, resource: string, resourceId?: string, details?: any, ipAddress?: string, userAgent?: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    action: string;
    resource: string;
    resourceId: string | null;
    details: import("@prisma/client/runtime/client").JsonValue | null;
    ipAddress: string | null;
    userAgent: string | null;
}>;
/**
 * Get audit logs for a user
 */
export declare function getUserAuditLogs(userId: string, limit?: number, offset?: number): Promise<{
    id: string;
    createdAt: Date;
    userId: string | null;
    action: string;
    resource: string;
    resourceId: string | null;
    details: import("@prisma/client/runtime/client").JsonValue | null;
    ipAddress: string | null;
    userAgent: string | null;
}[]>;
//# sourceMappingURL=userService.d.ts.map