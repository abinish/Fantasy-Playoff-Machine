import { ITeam } from "../models";

export interface IPowerRankingTeam extends ITeam {
    expectedWins: number;
    expectedLosses: number;
    powerRankingsScore: number;
}