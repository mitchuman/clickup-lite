function formatGreetingDate(): string {
	return new Date().toLocaleDateString('en-US', {
		timeZone: 'UTC',
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	})
}

export function DashboardHeader({ name }: { name: string }) {
	const firstName = name.split(/\s+/)[0] ?? name

	return (
		<header className="mb-2">
			<h1 className="text-xl font-semibold tracking-tight text-zinc-900">Good morning, {firstName}</h1>
			<p className="text-sm text-zinc-500">{formatGreetingDate()}</p>
		</header>
	)
}
