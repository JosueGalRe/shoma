// A Clash team of the player's, with the group chat the client joins for it
export interface ClashChatRoster {
  iconColorId: number | undefined
  iconId: number | undefined
  // A team still forming has no name or logo yet: the client calls it "Pending Team"
  isRegistered: boolean
  // The start of its conversation's id
  multiUserChatId: string
  name: string
  shortName: string
}

export interface ClashTournament {
  id?: number
  nameLocKey?: string
  nameLocKeySecondary?: string
  scheduleEndTime?: number
  scheduleTime?: number
  themeId?: number
}
