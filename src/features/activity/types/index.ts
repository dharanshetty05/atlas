import { ActivityType } from "@prisma/client";

export interface ActivityLogDTO {
  id: string;
  type: ActivityType;
  entityName: string | null;
  createdAt: Date;
}
