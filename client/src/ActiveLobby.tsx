import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, skipWhile, takeWhile } from 'rxjs/operators';

import Lobby, { PlainLobby } from './Lobby';
import Round, { PlainRound } from './Round';

export type LobbyUpdateFn = (lobby: PlainLobby | PlainRound) => void

export function setupActiveLobby(
    sendExitRequest: (lobbyID: string) => void,
    latest: Observable<PlainLobby | null>
): Observable<Lobby | null> {
    return latest.pipe(
        distinctUntilChanged((previous, next) => previous?.id === next?.id),
        map(x => x ?
            new Lobby(
                Round,
                () => sendExitRequest(x.id),
                x,
                latest.pipe(
                    filter((y): y is PlainLobby => !!y),
                    skipWhile(y => y.id !== x.id),
                    takeWhile(y => y.id === x.id)
                )
            )
            : null)
    );
}
