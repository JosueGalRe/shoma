import { execSync } from 'child_process';

if (!process.env.CI && !process.env.VERCEL) {
  try {
    execSync('effect-language-service patch', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to patch effect-language-service:', e);
    process.exit(1);
  }
}
