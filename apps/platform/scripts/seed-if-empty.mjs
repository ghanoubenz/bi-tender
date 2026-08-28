/**
 * Seed the demo workspace after a deployment, but only if it is not already
 * there. Never fails the build: a deployment that cannot seed should still go
 * live, so the failure is visible in the app rather than as a red build.
 */
try {
  const { execSync } = await import('child_process')
  execSync('npm run seed', { stdio: 'inherit' })
} catch (err) {
  console.warn('Seed skipped or failed (deployment continues):', err?.message)
}
