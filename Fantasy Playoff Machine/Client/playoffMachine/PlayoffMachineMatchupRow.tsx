import * as React from 'react';
import { IMatchupItem } from '../models';

export interface IPlayoffMachineRowProps {
    matchup: IMatchupItem;
    setMatchup(matchup: IMatchupItem, awayTeamWon: boolean, tie: boolean, homeTeamWon: boolean): void;
}

export const getHomeTeamClass = (matchup: IMatchupItem) => {
    const initialClassNames = "btn matchupButton";

    if (matchup.awayTeamWon)
        return initialClassNames + " btn-danger";
    if (matchup.homeTeamWon)
        return initialClassNames + " btn-success";

    return initialClassNames + " btn-default";
}

export const getAwayTeamClass = (matchup: IMatchupItem) => {
    const initialClassNames = "btn matchupButton";

    if (matchup.awayTeamWon)
        return initialClassNames + " btn-success";
    if (matchup.homeTeamWon)
        return initialClassNames + " btn-danger";

    return initialClassNames + " btn-default";
}

export const getTieClass = (matchup: IMatchupItem) => {
    const initialClassNames = "btn matchupButton";

    if (matchup.tie)
        return initialClassNames + " btn-warning";

    return initialClassNames + " btn-default";
}

export default function PowerRankingsRow( {matchup, setMatchup}: IPlayoffMachineRowProps) {
    function handleMatchup(matchup: IMatchupItem, awayTeamWon: boolean, tie: boolean, homeTeamWon: boolean) : void {
        setMatchup(matchup, awayTeamWon, tie, homeTeamWon);
    }

    return (
        <tr>
            <td><a className={getAwayTeamClass(matchup)} onClick={() => handleMatchup(matchup, true, false, false)} ng-click="setMatchup(matchup, true, false, false)">{matchup.awayTeamName}</a></td>
			<td><a className={getTieClass(matchup)} ng-click="setMatchup(matchup, false, true, false)">Tie</a></td>
			<td><a className={getHomeTeamClass(matchup)} ng-click="setMatchup(matchup, false, false, true)">{matchup.homeTeamName}</a></td>
		</tr>
    )
}