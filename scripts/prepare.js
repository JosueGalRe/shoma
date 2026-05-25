import { execSync } from 'child_process'

if (!process.env.CI && !process.env.VERCEL) {
  try {
    execSync('effect-language-service patch', { stdio: 'inherit' })
  } catch (error) {
    console.error('Failed to patch effect-language-service:', error)
    process.exit(1)
  }
}
