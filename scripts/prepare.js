import { execSync } from 'child_process'

if (!process.env.CI && !process.env.VERCEL) {
  try {
    execSync('effect-tsgo patch --typescript', { stdio: 'inherit' })
  } catch (error) {
    console.error('Failed to patch effect-tsgo:', error)
    process.exit(1)
  }
}
