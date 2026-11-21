import { useState, useSyncExternalStore } from 'react'

import { create, props } from '@stylexjs/stylex'

import { useRelayStore } from '@/core/state/relay-store'

import { ARAM_QUEUE_ID } from './sim-world'

import type { SimRelay } from './sim-relay'

interface SimPanelProps {
  relay: SimRelay
}

const LATENCIES = [0, 80, 400, 1500]
const CHAMP_SELECT_JUMPS = [
  ['planning', 'Planning'],
  ['ban', 'Mi ban'],
  ['pick', 'Mi pick'],
  ['finalization', 'Finalización'],
] as const
const ARAM_JUMPS = [
  ['pick', 'Cartas'],
  ['finalization', 'Banca'],
] as const

// Dev only: drives the simulated client from the page. Window.__shomaSim is the same relay, for the console
export function SimPanel({ relay }: SimPanelProps) {
  const snapshot = useSyncExternalStore(relay.subscribe, relay.getSnapshot)
  const [isOpen, setIsOpen] = useState(false)
  const { world } = relay
  const queue = snapshot.queueSeconds === null ? '' : ` · ${snapshot.queueSeconds}s`
  const label = `SIM · ${snapshot.phase}${queue}`

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true)
        }}
        {...props(styles.pill, snapshot.pendingApprovals.length > 0 && styles.pillAlert)}
      >
        {label}
      </button>
    )
  }

  return (
    <section aria-label="Simulador" {...props(styles.panel)}>
      <div {...props(styles.header)}>
        <strong>{label}</strong>

        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
          }}
          {...props(styles.button)}
        >
          Cerrar
        </button>
      </div>

      {snapshot.pendingApprovals.map((approval) => {
        return (
          <div key={approval.device} {...props(styles.row, styles.approval)}>
            <span {...props(styles.label)}>{approval.device}</span>

            <button
              type="button"
              onClick={() => {
                relay.resolveApproval(approval, true)
              }}
              {...props(styles.button)}
            >
              Aprobar
            </button>

            <button
              type="button"
              onClick={() => {
                relay.resolveApproval(approval, false)
              }}
              {...props(styles.button)}
            >
              Rechazar
            </button>
          </div>
        )
      })}

      <h3 {...props(styles.title)}>Emparejamiento (000000 no existe)</h3>

      <div {...props(styles.row)}>
        <button
          type="button"
          aria-pressed={snapshot.approvalMode === 'auto'}
          onClick={() => {
            relay.setApprovalMode(snapshot.approvalMode === 'auto' ? 'manual' : 'auto')
          }}
          {...props(styles.button)}
        >
          Aprobar: {snapshot.approvalMode === 'auto' ? 'solo' : 'a mano'}
        </button>

        <button
          type="button"
          onClick={() => {
            useRelayStore.getState().disconnect()
          }}
          {...props(styles.button)}
        >
          Desconectar
        </button>
      </div>

      <h3 {...props(styles.title)}>Conduit{snapshot.isConduitAway ? ' · fuera del relay' : ''}</h3>

      <div {...props(styles.row)}>
        <button
          type="button"
          onClick={() => {
            relay.dropConduit(false)
          }}
          {...props(styles.button)}
        >
          Cae la PC
        </button>

        <button
          type="button"
          onClick={() => {
            relay.dropConduit(true)
          }}
          {...props(styles.button)}
        >
          Cierra el cliente
        </button>

        <button
          type="button"
          disabled={!snapshot.isConduitAway}
          onClick={() => {
            relay.restoreConduit()
          }}
          {...props(styles.button)}
        >
          Vuelve
        </button>
      </div>

      <h3 {...props(styles.title)}>Latencia (ida)</h3>

      <div {...props(styles.row)}>
        {LATENCIES.map((latencyMs) => {
          return (
            <button
              key={latencyMs}
              type="button"
              aria-pressed={snapshot.latencyMs === latencyMs}
              onClick={() => {
                relay.setLatency(latencyMs)
              }}
              {...props(styles.button, snapshot.latencyMs === latencyMs && styles.selected)}
            >
              {latencyMs} ms
            </button>
          )
        })}
      </div>

      <h3 {...props(styles.title)}>Lobby · {snapshot.memberCount} miembros</h3>

      <div {...props(styles.row)}>
        <button
          type="button"
          onClick={() => {
            world.addMember()
          }}
          {...props(styles.button)}
        >
          + Miembro
        </button>

        <button
          type="button"
          onClick={() => {
            world.removeMember()
          }}
          {...props(styles.button)}
        >
          − Miembro
        </button>

        <button
          type="button"
          onClick={() => {
            world.kickLocalPlayer()
          }}
          {...props(styles.button)}
        >
          Me expulsan
        </button>

        <button
          type="button"
          onClick={() => {
            world.setOthersReady(true)
          }}
          {...props(styles.button)}
        >
          Otros listos
        </button>

        <button
          type="button"
          onClick={() => {
            world.setOthersReady(false)
          }}
          {...props(styles.button)}
        >
          Otros no listos
        </button>

        <button
          type="button"
          onClick={() => {
            world.receiveInvitation()
          }}
          {...props(styles.button)}
        >
          Me invitan
        </button>

        <button
          type="button"
          onClick={() => {
            world.receiveMessage()
          }}
          {...props(styles.button)}
        >
          Me escriben
        </button>

        <button
          type="button"
          onClick={() => {
            world.joinClash()
          }}
          {...props(styles.button)}
        >
          Equipo de Clash
        </button>
      </div>

      <h3 {...props(styles.title)}>Cola</h3>

      <div {...props(styles.row)}>
        <button
          type="button"
          onClick={() => {
            world.popMatch()
          }}
          {...props(styles.button)}
        >
          Saltar partida
        </button>

        <button
          type="button"
          onClick={() => {
            world.strangerDeclines()
          }}
          {...props(styles.button)}
        >
          Otro rechaza
        </button>

        <button
          type="button"
          aria-pressed={snapshot.autoPopMs !== null}
          onClick={() => {
            world.setAutoPop(snapshot.autoPopMs === null ? 6000 : null)
          }}
          {...props(styles.button)}
        >
          Salta sola: {snapshot.autoPopMs === null ? 'no' : `${snapshot.autoPopMs / 1000}s`}
        </button>
      </div>

      <h3 {...props(styles.title)}>Champ select (Reclutamiento)</h3>

      <div {...props(styles.row)}>
        {CHAMP_SELECT_JUMPS.map(([target, jumpLabel]) => {
          return (
            <button
              key={target}
              type="button"
              onClick={() => {
                world.jumpToChampSelect(target)
              }}
              {...props(styles.button)}
            >
              {jumpLabel}
            </button>
          )
        })}
      </div>

      <h3 {...props(styles.title)}>Champ select (ARAM)</h3>

      <div {...props(styles.row)}>
        {ARAM_JUMPS.map(([target, jumpLabel]) => {
          return (
            <button
              key={target}
              type="button"
              onClick={() => {
                world.jumpToChampSelect(target, ARAM_QUEUE_ID)
              }}
              {...props(styles.button)}
            >
              {jumpLabel}
            </button>
          )
        })}
      </div>

      <h3 {...props(styles.title)}>Partida</h3>

      <div {...props(styles.row)}>
        <button
          type="button"
          onClick={() => {
            world.dodgeChampSelect()
          }}
          {...props(styles.button)}
        >
          Otro esquiva
        </button>

        <button
          type="button"
          onClick={() => {
            world.requestSwapFromAlly()
          }}
          {...props(styles.button)}
        >
          Te piden cambio
        </button>

        <button
          type="button"
          onClick={() => {
            world.endGame()
          }}
          {...props(styles.button)}
        >
          Terminar partida
        </button>

        <button
          type="button"
          onClick={() => {
            world.playAgain()
          }}
          {...props(styles.button)}
        >
          Jugar de nuevo
        </button>
      </div>

      <div {...props(styles.row)}>
        <button
          type="button"
          onClick={() => {
            world.reset()
          }}
          {...props(styles.button, styles.danger)}
        >
          Reiniciar el mundo
        </button>
      </div>
    </section>
  )
}

const styles = create({
  approval: {
    backgroundColor: '#3b1d4a',
    borderRadius: 6,
    padding: 6,
  },
  button: {
    backgroundColor: {
      ':active': '#4a4f63',
      default: '#2b2f3d',
    },
    borderColor: '#4a4f63',
    borderRadius: 6,
    borderStyle: 'solid',
    borderWidth: 1,
    color: '#e8e9ef',
    cursor: 'pointer',
    fontSize: 12,
    paddingBlock: 5,
    paddingInline: 8,
  },
  danger: {
    borderColor: '#8a3a3a',
    color: '#ffb4b4',
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    flexGrow: 1,
    fontSize: 12,
  },
  panel: {
    backgroundColor: 'rgb(18 20 28 / 96%)',
    borderColor: '#c03cf0',
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 8px 30px rgb(0 0 0 / 50%)',
    color: '#e8e9ef',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    gap: 6,
    insetBlockStart: 8,
    insetInlineEnd: 8,
    maxHeight: 'calc(100dvh - 16px)',
    maxWidth: 340,
    overflowY: 'auto',
    padding: 10,
    position: 'fixed',
    zIndex: 2_147_483_647,
  },
  pill: {
    backgroundColor: 'rgb(18 20 28 / 90%)',
    borderColor: '#c03cf0',
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    color: '#f0c8ff',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 11,
    insetBlockStart: '50%',
    insetInlineEnd: 4,
    paddingBlock: 4,
    paddingInline: 8,
    position: 'fixed',
    zIndex: 2_147_483_647,
  },
  pillAlert: {
    backgroundColor: '#7a1fa0',
    color: '#fff',
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  selected: {
    backgroundColor: '#5b2a73',
    borderColor: '#c03cf0',
  },
  title: {
    color: '#a9adbf',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    margin: 0,
    marginBlockStart: 4,
    textTransform: 'uppercase',
  },
})
