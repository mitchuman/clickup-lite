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
	// Only present on GET /task/{id}; markdown_description requires
	// ?include_markdown_description=true on the request.
	description?: string | null
	markdown_description?: string | null
}

export interface ClickUpComment {
	id: string
	comment_text: string
	date: string
	user: ClickUpUserRef
	reply_count?: number | string
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

/** Slim shape cached by getTask — everything the task view renders. */
export interface TaskDetail {
	id: string
	name: string
	status: { status: string; color: string; type: string }
	dueDate: number | null
	url: string
	listId: string
	listName: string
	folderName: string | null
	assignees: { id: number; username: string; profilePicture: string | null }[]
	priority: { priority: string; color: string } | null
	timeEstimateMs: number | null
	/** Markdown when ClickUp provides it, else the plain description. */
	description: string | null
}

/** Slim shape cached by getTaskComments (oldest first). */
export interface CommentSummary {
	id: string
	text: string
	dateMs: number
	user: { id: number; username: string; profilePicture: string | null }
	replyCount: number
}

/** Slim shape cached by getTaskIndex/getArchiveTaskIndex — powers cmd+k. */
export interface TaskIndexEntry {
	id: string
	name: string
	listName: string
	status: string
	closed: boolean
}
