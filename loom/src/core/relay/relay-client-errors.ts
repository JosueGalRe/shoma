export class RelayClientError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelayClientError'
  }
}

export class RelayClientDisconnectedError extends RelayClientError {
  constructor() {
    super('Relay client is not connected.')
    this.name = 'RelayClientDisconnectedError'
  }
}

export class RelayHandshakeError extends RelayClientError {
  constructor(message: string) {
    super(message)
    this.name = 'RelayHandshakeError'
  }
}
