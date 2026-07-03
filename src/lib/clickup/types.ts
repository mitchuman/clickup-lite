export interface ClickUpTaskStatus {
	status: string
	color: string
	type: string
}

export interface ClickUpUserRef {
	id: number
	username: string
	email: string
	color?: string
	profilePicture?: string | null
}

export interface ClickUpTask {
	id: string
	name: string
	status: ClickUpTaskStatus
	due_date: string | null
	date_created: string
	date_updated: string
	url: string
	list: { id: string; name: string }
	folder?: { id: string; name: string } | null
	space: { id: string }
	assignees: ClickUpUserRef[]
	priority: { id: string; priority: string; color: string } | null
	time_estimate: number | null
}

export interface ClickUpTimeEntry {
	id: string
	task: { id: string; name: string; status: ClickUpTaskStatus } | null
	user: ClickUpUserRef
	start: string
	end: string | null
	duration: string
	task_url?: string
}

/** Slim shape cached by getUserTasks — see clickup/cached.ts for why. */
export interface TaskSummary {
	id: string
	name: string
	status: { status: string; type: string }
	dueDate: number | null
	url: string
	listName: string
}

/** Slim shape cached by getUserTimeEntries. */
export interface TimeEntrySummary {
	id: string
	taskName: string | null
	durationMs: number
}
