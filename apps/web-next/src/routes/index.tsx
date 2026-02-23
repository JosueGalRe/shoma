import { createFileRoute } from '@tanstack/react-router'

import { ConnectScreen } from '../features/connect/components/connect-screen'
import { useConnectPageController } from '../features/connect/hooks/use-connect-page-controller'

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
})

function IndexRouteComponent() {
  const {
    code,
    codeError,
    errorBanner,
    handleSubmit,
    isFailureState,
    isPendingState,
    onCancel,
    onRetry,
    onSubmit,
    register,
    shouldShowEntry,
    status,
    statusCopy,
  } = useConnectPageController()

  return (
    <ConnectScreen
      code={code}
      codeError={codeError}
      errorBanner={errorBanner}
      handleSubmit={handleSubmit}
      isFailureState={isFailureState}
      isPendingState={isPendingState}
      onCancel={onCancel}
      onRetry={onRetry}
      onSubmit={onSubmit}
      register={register}
      shouldShowEntry={shouldShowEntry}
      status={status}
      statusCopy={statusCopy}
    />
  )
}
