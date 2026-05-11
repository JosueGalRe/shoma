import { useEffect, useRef } from 'react'

import { readQueryCode } from '../connect-utils'

type UseAutoConnectFromQueryOptions = {
  handleConnect: (nextCode?: string) => Promise<void>
}

export function useAutoConnectFromQuery({ handleConnect }: UseAutoConnectFromQueryOptions) {
  const didAutoConnect = useRef(false)

  useEffect(() => {
    if (didAutoConnect.current) {
      return
    }

    didAutoConnect.current = true
    const queryCode = readQueryCode()
    if (!queryCode) {
      return
    }

    window.history.replaceState('', '', window.location.pathname)
    void handleConnect(queryCode)
  }, [handleConnect])
}
