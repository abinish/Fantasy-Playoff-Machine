export interface ILeagueDetails {
    leagueSettings: ILeagueSettings;
    remainingSchedule: IWeek[];
    completedSchedule: IWeek[];
    site: string;
}

export interface ILeagueSettings {
    leagueName: string;
    statusTypeId: number;
    regularSeasonWeeks: number;
    playoffTiebreakerID: PlayoffTiebreakerID;
    formatTypeId: number;
    tieRule: number;
    playoffTeams: number;
    divisions: IDivision[];
}

export interface IWeek {
    week: number;
    matchups: IMatchupItem[]
}

export interface IMatchupItem {
    awayTeamName: string;
    awayTeamScore: number;
    homeTeamName: string;
    homeTeamScore: number;
    awayTeamWon: boolean;
    homeTeamWon: boolean;
    tie: boolean;
    noWinnerSelected: boolean;
}

export interface IDivision {
    name: string;
    id: number;
    teams: ITeam[];
}

export interface ITeam {
    id: number;
    teamName: string;
    division: string;
    wins: number;
    losses: number;
    ties: number;
    divisionWins: number;
    divisionLosses: number;
    divisionTies: number;
    pointsFor: number;
    pointsAgainst: number;
    divisionRank: number;
    overallRank: number;
}

export enum PlayoffTiebreakerID {
	HeadToHead               = 0,
	TotalPointsScored        = 1,
	IntraDivisionRecord      = 2,
	TotalPointsAgainst       = 3
}

export interface ILeagueMetadata {
    site: string;
    id: string;
    name: string;
    userId: string;
    swid: string;
    s2: string;
}