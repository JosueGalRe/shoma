import { landscapeWarningStyles } from './landscape-warning-styles'

export function LandscapeWarningIcon() {
  const styles = landscapeWarningStyles()

  return (
    <div className={styles.iconWrap()}>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='40'
        height='40'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <rect width='12' height='20' x='6' y='2' rx='2' />
        <path d='M12 18h.01' />
      </svg>
    </div>
  )
}
