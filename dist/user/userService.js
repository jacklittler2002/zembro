"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPreferences = getUserPreferences;
exports.updateUserPreferences = updateUserPreferences;
exports.createNotification = createNotification;
exports.getUserNotifications = getUserNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.createAuditLog = createAuditLog;
exports.getUserAuditLogs = getUserAuditLogs;
const db_1 = require("../db");
/**
 * Get or create user preferences
 */
async function getUserPreferences(userId) {
    let preferences = await db_1.prisma.userPreferences.findUnique({
        where: { userId },
    });
    if (!preferences) {
        preferences = await db_1.prisma.userPreferences.create({
            data: { userId },
        });
    }
    return preferences;
}
/**
 * Update user preferences
 */
async function updateUserPreferences(userId, input) {
    return db_1.prisma.userPreferences.upsert({
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
async function createNotification(userId, type, title, message, data) {
    return db_1.prisma.notification.create({
        data: {
            userId,
            type: type,
            title,
            message,
            data,
        },
    });
}
/**
 * Get user notifications
 */
async function getUserNotifications(userId, limit = 50, offset = 0) {
    return db_1.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });
}
/**
 * Mark notification as read
 */
async function markNotificationRead(notificationId, userId) {
    return db_1.prisma.notification.updateMany({
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
async function markAllNotificationsRead(userId) {
    return db_1.prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
    });
}
/**
 * Get unread notification count
 */
async function getUnreadNotificationCount(userId) {
    return db_1.prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
}
/**
 * Create an audit log entry
 */
async function createAuditLog(userId, action, resource, resourceId, details, ipAddress, userAgent) {
    return db_1.prisma.auditLog.create({
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
async function getUserAuditLogs(userId, limit = 100, offset = 0) {
    return db_1.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });
}
//# sourceMappingURL=userService.js.map