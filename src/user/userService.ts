import { prisma } from "../db";

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
export async function getUserPreferences(userId: string) {
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: { userId },
    });
  }

  return preferences;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, input: UserPreferencesInput) {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: input,
    create: {
      userId,
      ...input,
    },
  });
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) {
  return prisma.notification.create({
    data: {
      userId,
      type: type as any,
      title,
      message,
      data,
    },
  });
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, limit = 50, offset = 0) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true },
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  return prisma.auditLog.create({
    data: {
      ...(userId && { userId }),
      action,
      resource,
      ...(resourceId && { resourceId }),
      ...(details && { details }),
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
    },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 100, offset = 0) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}