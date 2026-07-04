import { cacheLife, cacheTag } from 'next/cache'
import { tags } from '@/lib/cache/tags'
import { env } from '@/lib/env'
import { cu } from './client'
import type {
	ClickUpComment,
	ClickUpTask,
	ClickUpTimeEntry,
	CommentSummary,
	TaskDetail,
	TaskIndexEntry,
	TaskSummary,
	TimeEntrySummary,
} from './types'

function toTaskSummary(task: ClickUpTask): TaskSummary {
	return {
		id: task.id,
		name: task.name,
		status: { status: task.status.status, type: task.status.type },
		dueDate: task.due_date ? Number(task.due_date) : null,
		url: task.url,
		listName: task.list.name,
	}
}

// ClickUp's filtered-team-tasks endpoint pages at 100; the page cap bounds the
// loop in case a filter ever matches an unexpectedly huge set.
const TEAM_TASKS_MAX_PAGES = 30

async function fetchTeamTasks(
	searchParams: Record<string, string | number | boolean | string[]>,
): Promise<ClickUpTask[]> {
	const all: ClickUpTask[] = []
	for (let page = 0; page < TEAM_TASKS_MAX_PAGES; page++) {
		const { tasks } = await cu<{ tasks: ClickUpTask[] }>(`/team/${env.clickupTeamId}/task`, {
			token: env.clickupServiceToken,
			searchParams: { ...searchParams, page },
		})
		all.push(...tasks)
		if (tasks.length < 100) break
	}
	return all
}

/**
 * One user's full open-task set, trimmed to the fields the homepage needs —
 * caching full raw ClickUp task objects (custom_fields, watchers, checklists,
 * etc.) bloats the cache entry and slows down JSON parsing for no benefit.
 * Backs the Today/Overdue/WeekLoad widgets — they all call this and filter in
 * memory, so one cached ClickUp call powers three widgets instead of three.
 */
export async function getUserTasks(clickupUserId: string): Promise<TaskSummary[]> {
	'use cache: remote'
	cacheTag(tags.userTasks(clickupUserId))
	cacheLife('hours')

	const tasks = await fetchTeamTasks({
		assignees: [clickupUserId],
		subtasks: true,
		include_closed: false,
	})
	return tasks.map(toTaskSummary)
}

function toTimeEntrySummary(entry: ClickUpTimeEntry): TimeEntrySummary {
	return {
		id: entry.id,
		taskName: entry.task?.name ?? null,
		durationMs: Number(entry.duration),
	}
}

/** One user's time entries for a single calendar day (UTC boundaries for now). */
export async function getUserTimeEntries(clickupUserId: string, isoDate: string): Promise<TimeEntrySummary[]> {
	'use cache: remote'
	cacheTag(tags.userTime(clickupUserId, isoDate))
	cacheLife('minutes')

	const startMs = new Date(`${isoDate}T00:00:00.000Z`).getTime()
	const endMs = new Date(`${isoDate}T23:59:59.999Z`).getTime()

	const { data } = await cu<{ data: ClickUpTimeEntry[] }>(`/team/${env.clickupTeamId}/time_entries`, {
		token: env.clickupServiceToken,
		searchParams: {
			assignee: clickupUserId,
			start_date: startMs,
			end_date: endMs,
		},
	})
	return data.map(toTimeEntrySummary)
}

function toTaskDetail(task: ClickUpTask): TaskDetail {
	return {
		id: task.id,
		name: task.name,
		status: { status: task.status.status, color: task.status.color, type: task.status.type },
		dueDate: task.due_date ? Number(task.due_date) : null,
		url: task.url,
		listId: task.list.id,
		listName: task.list.name,
		folderName: task.folder?.name ?? null,
		assignees: task.assignees.map((a) => ({
			id: a.id,
			username: a.username,
			profilePicture: a.profilePicture ?? null,
		})),
		priority: task.priority ? { priority: task.priority.priority, color: task.priority.color } : null,
		timeEstimateMs: task.time_estimate,
		description: task.markdown_description || task.description || null,
	}
}

/** A single task's core fields + description, for the task view. */
export async function getTask(taskId: string): Promise<TaskDetail> {
	'use cache: remote'
	cacheTag(tags.task(taskId))
	cacheLife('hours')

	const task = await cu<ClickUpTask>(`/task/${taskId}`, {
		token: env.clickupServiceToken,
		searchParams: { include_markdown_description: true },
	})
	return toTaskDetail(task)
}

function toCommentSummary(comment: ClickUpComment): CommentSummary {
	return {
		id: comment.id,
		text: comment.comment_text,
		dateMs: Number(comment.date),
		user: {
			id: comment.user.id,
			username: comment.user.username,
			profilePicture: comment.user.profilePicture ?? null,
		},
		replyCount: Number(comment.reply_count ?? 0),
	}
}

/**
 * A task's comment thread, oldest first (ClickUp returns newest first).
 * Tagged with both the comments tag (webhook comment events, postComment's
 * updateTag) and the task tag so a task delete sweeps this entry too.
 */
export async function getTaskComments(taskId: string): Promise<CommentSummary[]> {
	'use cache: remote'
	cacheTag(tags.taskComments(taskId), tags.task(taskId))
	cacheLife('hours')

	const { comments } = await cu<{ comments: ClickUpComment[] }>(`/task/${taskId}/comment`, {
		token: env.clickupServiceToken,
	})
	return comments.map(toCommentSummary).reverse()
}

function toTaskIndexEntry(task: ClickUpTask): TaskIndexEntry {
	return {
		id: task.id,
		name: task.name,
		listName: task.list.name,
		status: task.status.status,
		closed: task.status.type === 'closed',
	}
}

/**
 * Slim index of every open task in the workspace — one shared cache entry that
 * makes cmd+k tier-1 a purely client-side filter. Kept fresh by the ClickUp
 * webhook revalidating team:task-index on any task event.
 */
export async function getTaskIndex(): Promise<TaskIndexEntry[]> {
	'use cache: remote'
	cacheTag(tags.teamTaskIndex())
	cacheLife('hours')

	const tasks = await fetchTeamTasks({ subtasks: true, include_closed: false })
	return tasks.map(toTaskIndexEntry)
}

/**
 * cmd+k tier-2 corpus: open + recently-closed tasks (last 90 days by update).
 * ClickUp v2 has no free-text search endpoint, so /api/search filters this one
 * shared cache entry in memory instead of creating a cache entry per query.
 */
export async function getArchiveTaskIndex(): Promise<TaskIndexEntry[]> {
	'use cache: remote'
	cacheTag(tags.teamTaskIndex())
	cacheLife('hours')

	const cutoffMs = Date.now() - 90 * 24 * 60 * 60 * 1000
	const tasks = await fetchTeamTasks({
		subtasks: true,
		include_closed: true,
		order_by: 'updated',
		date_updated_gt: cutoffMs,
	})
	return tasks.map(toTaskIndexEntry)
}
