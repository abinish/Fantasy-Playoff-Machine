import * as React from "react";
import * as ReactDOM from "react-dom";
import { PacmanLoader } from "react-spinners";
import { createStore } from 'redux'
import { getLeagueDetails } from "./actions/getLeagueDetails";
import LeagueCard from "./landingPage/LeagueCard";
import { ILeagueMetadata } from "./models";
import leagueDetails from './reducers/leagueDetails'
import Text from './text'

const store = createStore(leagueDetails);
const unsubscribe = store.subscribe(() => console.log(store.getState()))
const result = getLeagueDetails('espn', '23007934', '', '', '');
console.log(store.getState())

function handleClick(league: ILeagueMetadata) : void {
    console.log('click happened')
};

const league: ILeagueMetadata = {
    site: "espn",
    id: "23007934",
    swid: "",
    s2: "",
    userId: "",
    name: "test"
};

ReactDOM.render(
    <div>
        <LeagueCard league={league} onDeleteLeague={handleClick}/>
        <PacmanLoader loading={true} color={'#007bc4'}/>
    </div>,
    document.getElementById("root")
    
);

unsubscribe();