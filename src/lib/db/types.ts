import type { ColumnType, Generated } from 'kysely'

type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>

export interface ProjectMappingsTable {
	id: Generated<number>
	clickup_list_id: string
	clickup_space_id: string | null
	name: string
	github_repo: string | null
	github_default_branch: string | null
	shopify_store_domain: string | null
	vercel_project_id: string | null
	netlify_site_id: string | null
	sanity_project_id: string | null
	sanity_dataset: string | null
	staging_url: string | null
	production_url: string | null
	deploys_task_id: string | null
	created_at: Generated<Timestamp>
	updated_at: Generated<Timestamp>
}

export interface PinnedTasksTable {
	id: Generated<number>
	user_id: string
	clickup_task_id: string
	task_name: string
	position: Generated<number>
	pinned_at: Generated<Timestamp>
}

export interface CommentPresetsTable {
	id: Generated<number>
	user_id: string | null // null = team-shared
	label: string
	body_template: string
	position: Generated<number>
	created_at: Generated<Timestamp>
}

export interface PushSubscriptionsTable {
	id: Generated<number>
	user_id: string
	endpoint: string
	p256dh: string
	auth: string
	user_agent: string | null
	created_at: Generated<Timestamp>
}

export interface NotificationsTable {
	id: Generated<number>
	clickup_user_id: string
	type: string
	clickup_task_id: string | null
	task_name: string | null
	actor: string | null
	body: string | null
	read_at: Timestamp | null
	created_at: Generated<Timestamp>
}

export interface DeployEventsTable {
	id: Generated<number>
	provider: string
	deploy_id: string
	mapping_id: number | null
	clickup_task_id: string | null
	clickup_comment_id: string | null
	state: string
	branch: string | null
	commit_sha: string | null
	commit_message: string | null
	url: string | null
	created_at: Generated<Timestamp>
	updated_at: Generated<Timestamp>
}

export interface UserPrefsTable {
	user_id: string
	timezone: string | null
	notify_assigned: Generated<boolean>
	notify_comment: Generated<boolean>
	notify_mention: Generated<boolean>
	notify_due: Generated<boolean>
	notify_deploy: Generated<boolean>
	home_layout: unknown | null
}

export interface WebhookStateTable {
	id: Generated<number>
	clickup_webhook_id: string
	team_id: string
	endpoint_url: string
	secret: string
	events: unknown
	created_at: Generated<Timestamp>
}

export interface PrDispatchesTable {
	id: Generated<number>
	clickup_task_id: string
	repo: string
	workflow_run_url: string | null
	dispatched_by: string
	status: Generated<string>
	created_at: Generated<Timestamp>
}

export interface CacheEntriesTable {
	cache_key: string
	value: string
	tags: string[]
	stale: number
	timestamp: number
	expire: number
	revalidate: number
}

export interface CacheTagsTable {
	tag: string
	revalidated_at: number
}

export interface Database {
	project_mappings: ProjectMappingsTable
	pinned_tasks: PinnedTasksTable
	comment_presets: CommentPresetsTable
	push_subscriptions: PushSubscriptionsTable
	notifications: NotificationsTable
	deploy_events: DeployEventsTable
	user_prefs: UserPrefsTable
	webhook_state: WebhookStateTable
	pr_dispatches: PrDispatchesTable
	// used by cache-handlers/remote-handler.js via a separate pg connection,
	// listed here only so the app's own Kysely instance can inspect them
	cache_entries: CacheEntriesTable
	cache_tags: CacheTagsTable
	// better-auth core tables (user, session, account, verification) are
	// added here in Phase 1 once `bunx @better-auth/cli generate` runs.
}
