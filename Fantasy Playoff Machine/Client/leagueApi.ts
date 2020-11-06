import { ILeagueDetails, ILeagueMetadata } from './models'

export async function verifyLeagueExists( parameters: {
    site: string,
    leagueId: string,
    userId: string,
    swid: string,
    s2: string
}) {
    const response = await fetch(`https://www.theffhub.com/Home/VerifyLeagueExists?site=${parameters.site}&leagueId=${parameters.leagueId}&userId=${parameters.userId}&swid=${parameters.swid}&s2=${parameters.s2}`)
    checkStatus(response);
    return await response.json() as boolean;
}

export async function getLeagues() {
    const response = await fetch(`https://localhost:44313/Home/leagueMetadata`)
    checkStatus(response);
    return await response.json() as [ILeagueMetadata];
}

export async function getLeagueDetails( parameters: {
    site: string,
    leagueId: string,
    userId: string,
    swid: string,
    s2: string
}) {
    const response = await fetch(`https://localhost:44313/Home/api?site=${parameters.site}&leagueId=${parameters.leagueId}&userId=${parameters.userId}&swid=${parameters.swid}&s2=${parameters.s2}`)
    checkStatus(response);
    return await response.json() as ILeagueDetails;
}

export function checkStatus(response: Response) {
	const redirectLocation = response.redirected === true ? response.url : response.headers.get('location');
	if (response.status >= 200 && response.status < 300) {
		return response;
	} else if (redirectLocation) {
		window.location.replace(redirectLocation);
		throw new Error(response.statusText);
	} else {
		throw new Error(response.statusText);
	}
}
