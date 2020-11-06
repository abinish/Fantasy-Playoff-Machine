import * as React from 'react';
import { IPowerRankingTeam } from './models'

export interface IPowerRankingsRowProps {
    team: IPowerRankingTeam;
}

export default function PowerRankingsRow( {team}: IPowerRankingsRowProps) {
    return (
        <tr>
            <td>{team.teamName}</td>
            <td>{team.powerRankingsScore.toFixed(2)}</td>
            <td>{team.wins}</td>
            <td>{team.losses}</td>
            <td>{team.ties}</td>
		</tr>
    )
}