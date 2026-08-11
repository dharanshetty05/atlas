import React from "react";
import { ActivityLogDTO } from "../types";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed({ activities }: { activities: ActivityLogDTO[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/50">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Activity History
        </h3>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {activities.map((activity) => {
          let actionText = "Performed an action";
          switch (activity.type) {
            case "LOGIN":
              actionText = "Logged in";
              break;
            case "LOGOUT":
              actionText = "Logged out";
              break;
            case "UPLOAD":
              actionText = `Uploaded "${activity.entityName}"`;
              break;
            case "UPDATE":
              actionText = `Renamed to "${activity.entityName}"`;
              break;
            case "DOWNLOAD":
              actionText = `Downloaded "${activity.entityName}"`;
              break;
            case "DELETE":
              actionText = `Deleted "${activity.entityName}"`;
              break;
            case "RESTORE":
              actionText = `Restored "${activity.entityName}"`;
              break;
            case "CREATE":
              actionText = `Created folder "${activity.entityName}"`;
              break;
            case "SEARCH":
              actionText = `Searched for "${activity.entityName}"`; // or use metadata query if available, but rule says entityName="Search" so it will be "Searched for 'Search'" wait. Wait, rule says: SEARCH -> "Search". So I'll just say "Searched".
              actionText = `Performed search`;
              break;
            case "AI_COMPLETION":
              actionText = `AI analysis completed for "${activity.entityName}"`;
              break;
            default:
              actionText = `Action: ${activity.type}`;
          }

          return (
            <div key={activity.id} className="flex flex-col px-6 py-4">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {actionText}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
