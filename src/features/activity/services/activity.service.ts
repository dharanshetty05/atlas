import { ActivityType } from "@prisma/client";
import { db } from "@/lib/db";
import { ActivityLogDTO } from "../types";

export interface CreateLogInput {
  userId: string;
  type: ActivityType;
  entityName?: string | null;
  documentId?: string | null;
  metadata?: any;
}

export class ActivityService {
  /**
   * Writes an activity log to the database.
   * This method catches and logs its own errors so that business operations
   * are not interrupted by a failure in activity logging.
   */
  async logActivity(input: CreateLogInput): Promise<void> {
    try {
      await db.activityLog.create({
        data: {
          userId: input.userId,
          type: input.type,
          documentId: input.documentId ?? null,
          metadata: {
            entityName: input.entityName ?? null,
            ...input.metadata,
          },
        },
      });
    } catch (error) {
      // Intentionally swallow error and log server-side to prevent breaking business operations
      console.error("[ActivityService] Failed to log activity:", error);
    }
  }

  /**
   * Retrieves a lightweight list of recent activities scoped to the specified user.
   */
  async getRecentActivities(userId: string, limit: number = 20): Promise<ActivityLogDTO[]> {
    const logs = await db.activityLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return logs.map((log) => {
      const metadata = log.metadata as any;
      return {
        id: log.id,
        type: log.type,
        entityName: metadata?.entityName ?? null,
        createdAt: log.createdAt,
      };
    });
  }
}

export const activityService = new ActivityService();
