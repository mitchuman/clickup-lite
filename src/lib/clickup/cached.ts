import { cacheLife, cacheTag } from 'next/cache'
import { tags } from '@/lib/cache/tags'
import { env } from '@/lib/env'
import { cu } from './client'
import type { ClickUpTask, ClickUpTimeEntry, TaskSummary, TimeEntrySummary } from './types'

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

async function fetchAllUserTasks(clickupUserId: string): Promise<TaskSummary[]> {
	const summaries: TaskSummary[] = []
	for (let page = 0; ; page++) {
		const { tasks } = await cu<{ tasks: ClickUpTask[] }>(`/team/${env.clickupTeamId}/task`, {
			token: env.clickupServiceToken,
			searchParams: {
				assignees: [clickupUserId],
				subtasks: true,
				include_closed: false,
				page,
			},
		})
		summaries.push(...tasks.map(toTaskSummary))
		if (tasks.length < 100) break
	}
	return summaries
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

	return fetchAllUserTasks(clickupUserId)
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
