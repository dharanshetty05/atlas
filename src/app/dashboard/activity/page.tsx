import React from "react";
import { requireAuth } from "@/lib/auth/server";
import { activityService } from "@/features/activity/services/activity.service";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import { Breadcrumbs } from "@/features/workspace/components/breadcrumbs";

export const metadata = {
  title: "Activity History | Atlas",
};

export default async function ActivityPage() {
  const { user } = await requireAuth();
  const activities = await activityService.getRecentActivities(user.id, 50);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          Activity History
        </span>
      </div>
      <ActivityFeed activities={activities} />
    </div>
  );
}
