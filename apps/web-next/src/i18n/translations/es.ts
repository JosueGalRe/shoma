const es = {
  common: {
    cancel: 'Cancelar',
    close: 'Cerrar',
    connect: 'Conectar',
    decline: 'Rechazar',
    invite: 'Invitar',
    leave: 'Salir',
    ok: 'OK',
    retry: 'Reintentar',
    save: 'Guardar',
  },
  connection: {
    title: 'Conectar con Mimic',
    subtitle: 'Ingresa tu código de 6 dígitos para iniciar una sesión segura.',
    codePlaceholder: '000000',
    invalidCode: 'El código de conexión debe tener 6 dígitos.',
    sessionExpired: 'Tu sesión anterior expiró. Ingresa un nuevo código.',
  },
  lobby: {
    title: 'Lobby',
    create: 'Crear lobby',
    leaveConfirm: '¿Salir del lobby?',
    noData: 'No hay datos del lobby disponibles.',
  },
  queue: {
    title: 'Cola',
    findMatch: 'Buscar partida',
    leave: 'Salir de la cola',
    searching: 'Buscando',
    notInQueue: 'No estás en una cola.',
  },
  readyCheck: {
    title: 'Ready check',
    accept: 'Aceptar partida',
    decline: 'Rechazar partida',
    none: 'No hay un ready check activo.',
  },
  invites: {
    title: 'Invitaciones',
    none: 'No hay invitaciones pendientes.',
    open: 'Abrir invitaciones',
  },
  champSelect: {
    title: 'Selección de campeón',
    phase: 'Fase',
    timeLeft: 'Tiempo restante',
    yourTurn: 'Tu turno',
    noSession: 'No hay una sesión activa de selección de campeón.',
  },
  errors: {
    generic: 'Algo salió mal.',
    network: 'Error de red. Intenta de nuevo.',
    unavailable: 'Esta función no está disponible por ahora.',
  },
} as const

export default es
