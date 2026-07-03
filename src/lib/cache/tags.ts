/**
 * Cache tag constructors for the ClickUp data layer (see src/lib/clickup/cached.ts).
 * Every 'use cache: remote' fetcher tags its result with one of these so the
 * ClickUp webhook handler can invalidate precisely via revalidateTag(tag, 'max').
 */
export const tags = {
	/** A single task's core fields. Invalidated by taskUpdated/taskDeleted. */
	task: (taskId: string) => `task:${taskId}`,
	/** A task's comment thread. Invalidated by taskCommentPosted/Updated. */
	taskComments: (taskId: string) => `task:${taskId}:comments`,
	/** A task's linked GitHub commits. Time-based only (no webhook source). */
	taskCommits: (taskId: string) => `task:${taskId}:commits`,
	/** All tasks in a ClickUp list. Invalidated by create/update/move within the list. */
	list: (listId: string) => `list:${listId}`,
	/** One user's full task set (backs Today/Overdue/WeekLoad). Invalidated by any
	 * task event where the user is an assignee, before or after the change. */
	userTasks: (clickupUserId: string) => `user:${clickupUserId}:tasks`,
	/** One user's time entries for a single day. Time-based only. */
	userTime: (clickupUserId: string, isoDate: string) => `user:${clickupUserId}:time:${isoDate}`,
	/** Space/folder/list hierarchy. Invalidated by structural webhook events. */
	teamHierarchy: () => 'team:hierarchy',
	/** Slim open-task index powering cmd+k. Invalidated by task create/update/delete. */
	teamTaskIndex: () => 'team:task-index',
	/** Project ID mappings (Shopify/Vercel/Netlify/Sanity/GitHub <-> ClickUp list). */
	mappings: () => 'mappings',
}
