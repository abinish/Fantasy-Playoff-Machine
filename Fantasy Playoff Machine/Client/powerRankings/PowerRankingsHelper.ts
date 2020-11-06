import { ILeagueDetails } from "../models";
import { IPowerRankingTeam } from "./models";

export const getTeam = (teamName: string, teams: IPowerRankingTeam[]) : IPowerRankingTeam => {
    return teams.find(team => team.teamName == teamName)!;
}
export const getPowerRankingTeams = (league: ILeagueDetails): IPowerRankingTeam[] | null => {
    if (league == null){
        return null;
    }

    var teams = league.leagueSettings.divisions.flatMap(division => division.teams.map(team => (<IPowerRankingTeam>{  ...team, expectedWins: 0, expectedLosses: 0, powerRankingsScore: 0 } )));
    var totalPoints = 0;
    var totalGames = 0;

    league.completedSchedule.forEach(week => {
        week.matchups.forEach(matchup => {
            // var awayTeam = getTeam(matchup.awayTeamName, teams);
            // awayTeam.pointsFor += matchup.awayTeamScore;
            // awayTeam.pointsAgainst += matchup.homeTeamScore;
            
            totalPoints += matchup.awayTeamScore + matchup.homeTeamScore;
            totalGames += 2;

            // var homeTeam = getTeam(matchup.homeTeamName, teams);
            // homeTeam.pointsFor += matchup.homeTeamScore;
            // homeTeam.pointsAgainst += matchup.awayTeamScore;

            // if(matchup.awayTeamWon){
            //     awayTeam.wins += 1;
            //     homeTeam.losses += 1;
            // }else if (matchup.homeTeamWon){
            //     awayTeam.losses += 1;
            //     homeTeam.wins += 1;
            // }else if (matchup.tie){
            //     awayTeam.ties += 1;
            //     homeTeam.ties += 1;
            // }
        })
    });

    var averagePoints = 93;
    if(league.completedSchedule.length > 2){
        averagePoints = totalPoints / totalGames;
    }

    league.completedSchedule.forEach(week => {
        week.matchups.forEach(matchup => {
            var awayTeam = getTeam(matchup.awayTeamName, teams);
            if(matchup.awayTeamScore > averagePoints){
                awayTeam.expectedWins += 1;
            }else {
                awayTeam.expectedLosses += 1;
            }

            var homeTeam = getTeam(matchup.homeTeamName, teams);
            if(matchup.homeTeamScore > averagePoints){
                homeTeam.expectedWins += 1;
            }else {
                homeTeam.expectedLosses += 1;
            }
        })
    });

    teams.forEach(team => {
        var espnScore = team.pointsFor + (team.pointsFor * (team.wins/ (team.wins + team.losses)));
        var expectedScore = team.pointsFor + (team.pointsFor * (team.expectedWins / (team.expectedWins + team.expectedLosses)))
        team.powerRankingsScore = espnScore + expectedScore;
    })
    return teams;
}