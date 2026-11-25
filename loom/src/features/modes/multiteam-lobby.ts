export interface MultiteamLobbyConfig {
  // How many players make a team
  playerSlotCount: number
  // How many teams the lobby holds
  subteamCount: number
}

// The client's own table of the queues played in teams of a few (Arena and its variants), QUEUE_ID_TO_MULTITEAM_LOBBY_CONFIG
// In rcp-fe-lol-parties: the queue doesn't carry its team size, so this changes with the client.
// Shortcut: copied as of patch 16.23; a new Arena variant's queue needs adding here
export const MULTITEAM_LOBBY_CONFIG: Readonly<Partial<Record<number, MultiteamLobbyConfig>>> = {
  1160: { playerSlotCount: 2, subteamCount: 4 },
  1162: { playerSlotCount: 2, subteamCount: 2 },
  1602: { playerSlotCount: 2, subteamCount: 5 },
  1603: { playerSlotCount: 3, subteamCount: 5 },
  1604: { playerSlotCount: 2, subteamCount: 2 },
  1605: { playerSlotCount: 2, subteamCount: 4 },
  1606: { playerSlotCount: 3, subteamCount: 4 },
  1608: { playerSlotCount: 2, subteamCount: 6 },
  1609: { playerSlotCount: 2, subteamCount: 7 },
  1611: { playerSlotCount: 3, subteamCount: 3 },
  1614: { playerSlotCount: 3, subteamCount: 8 },
  1615: { playerSlotCount: 2, subteamCount: 12 },
  1616: { playerSlotCount: 2, subteamCount: 9 },
  1617: { playerSlotCount: 3, subteamCount: 6 },
  1618: { playerSlotCount: 3, subteamCount: 1 },
  1700: { playerSlotCount: 2, subteamCount: 8 },
  1701: { playerSlotCount: 1, subteamCount: 1 },
  1702: { playerSlotCount: 2, subteamCount: 1 },
  1704: { playerSlotCount: 2, subteamCount: 2 },
  1710: { playerSlotCount: 2, subteamCount: 8 },
  1720: { playerSlotCount: 2, subteamCount: 8 },
  1731: { playerSlotCount: 1, subteamCount: 1 },
  1732: { playerSlotCount: 2, subteamCount: 1 },
  1734: { playerSlotCount: 2, subteamCount: 2 },
  1736: { playerSlotCount: 2, subteamCount: 3 },
  1738: { playerSlotCount: 2, subteamCount: 4 },
  1740: { playerSlotCount: 3, subteamCount: 6 },
  1741: { playerSlotCount: 2, subteamCount: 5 },
  1742: { playerSlotCount: 2, subteamCount: 6 },
  1744: { playerSlotCount: 2, subteamCount: 7 },
  1750: { playerSlotCount: 3, subteamCount: 6 },
  1751: { playerSlotCount: 1, subteamCount: 1 },
  1753: { playerSlotCount: 3, subteamCount: 1 },
  1756: { playerSlotCount: 3, subteamCount: 2 },
  1759: { playerSlotCount: 3, subteamCount: 3 },
  1762: { playerSlotCount: 3, subteamCount: 4 },
  1765: { playerSlotCount: 3, subteamCount: 5 },
  1767: { playerSlotCount: 2, subteamCount: 8 },
  3020: { playerSlotCount: 2, subteamCount: 4 },
  4015: { playerSlotCount: 3, subteamCount: 6 },
  4016: { playerSlotCount: 2, subteamCount: 8 },
  4018: { playerSlotCount: 1, subteamCount: 2 },
  4019: { playerSlotCount: 3, subteamCount: 6 },
  4020: { playerSlotCount: 3, subteamCount: 4 },
  4021: { playerSlotCount: 3, subteamCount: 4 },
  4030: { playerSlotCount: 3, subteamCount: 4 },
  4031: { playerSlotCount: 3, subteamCount: 4 },
  6090: { playerSlotCount: 2, subteamCount: 4 },
  6092: { playerSlotCount: 2, subteamCount: 1 },
  6094: { playerSlotCount: 2, subteamCount: 2 },
}
