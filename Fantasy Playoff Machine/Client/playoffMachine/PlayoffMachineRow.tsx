import * as React from 'react';
import { ITeam } from '../models';

export interface IPlayoffMachineRowProps {
    team: ITeam;
}

export default function PlayoffMachineRow( {team}: IPlayoffMachineRowProps) {
    return (
        <tr>
            <td>{team.teamName}</td>
            <td>{team.wins}</td>
            <td>{team.losses}</td>
            <td>{team.ties}</td>
		</tr>
    )
}