import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, skipWhile, takeWhile } from 'rxjs/operators';
import CurrentQuestion from './CurrentQuestion';

import Lobby, { PlainLobby, LobbyCmd } from './Lobby';
import Round, { PlainRound } from './Round';

export type LobbyUpdateFn = (lobby: PlainLobby | PlainRound) => void

export function setupActiveLobby(
    sendCmd: (cmd: LobbyCmd) => void,
    latest: Observable<PlainLobby | null>
): Observable<Lobby | null> {
    return latest.pipe(
        distinctUntilChanged((previous, next) => previous?.id === next?.id),
        map(x => x ?
            new Lobby(
                (...roundArgs) => new Round(
                    (...currentQuestionArgs) => new CurrentQuestion(...currentQuestionArgs),
                    ...roundArgs
                ),
                sendCmd,
                x,
                latest.pipe(
                    filter((y): y is PlainLobby => !!y),
                    skipWhile(y => y.id !== x.id),
                    takeWhile(y => y.id === x.id)
                )
            ) :
            null
        )
    );
}
