import { createContext, useContext } from 'react'

export const TeamContext = createContext({ role: 'admin', teams: [], liderados: [] })
export function useTeam() { return useContext(TeamContext) }
