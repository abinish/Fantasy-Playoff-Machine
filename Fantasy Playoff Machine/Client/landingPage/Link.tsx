import * as React from 'react';
import { ILeagueMetadata } from '../models';
import { LinkType } from './models'

export interface ILinkProps {
    league: ILeagueMetadata;
    type: LinkType
}

export const toolName = (type: LinkType) => {
    switch(type){
        case LinkType.PlayoffMachine:
            return "PlayoffMachine";
        case LinkType.PlayoffOdds:
            return "PlayoffOdds";
        case LinkType.PowerRankings:
            return "PowerRankings";
        case LinkType.Scheduler:
            return "Scheduler";
        default:
            return "PlayoffMachine";
    }
}

export const toolPrettyName = (type: LinkType) => {
    switch(type){
        case LinkType.PlayoffMachine:
            return "Playoff Machine";
        case LinkType.PlayoffOdds:
            return "Playoff Odds";
        case LinkType.PowerRankings:
            return "Power Rankings";
        case LinkType.Scheduler:
            return "Schedule Comparison";
        default:
            return "Playoff Machine";
    }
}

export const relativeUrl = (league: ILeagueMetadata, type: LinkType) => {
    return "/Home/About/" + toolName(type) + "?site=" + league.site + "&leagueId=" + league.leagueId + "&userId=" + league.userId + "&s2=" + league.s2 + "&swid=" + league.swid;
}

export default function Link( {league, type}: ILinkProps) {
    return (
		<a href={relativeUrl(league, type)}>{toolPrettyName(type)}</a>		
    )
}