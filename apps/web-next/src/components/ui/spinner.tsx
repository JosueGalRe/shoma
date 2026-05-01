export function Spinner({ className }: { className?: string }) {
  return (
    <div className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#785a28] border-t-[#c8a96e] ${className}`} />
  )
}
