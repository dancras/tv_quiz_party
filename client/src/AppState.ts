import { Subject, BehaviorSubject, withLatestFrom, map, Observable } from 'rxjs';
import clone from 'just-clone';
import { PlainLobby } from './Model/Lobby';
import { PlainRound } from './Model/Round';
import { PlainCurrentQuestionMetadata } from './Model/CurrentQuestion';

export type AppState = {
    userID: string,
    activeLobby: PlainLobby | null
};
export type AppStateEvent =
    { code: 'USER_ID_SET', data: string } |
    { code: 'ACTIVE_LOBBY_UPDATED', data: PlainLobby | null } |
    { code: 'ACTIVE_ROUND_UPDATED', data: PlainRound } |
    { code: 'CURRENT_QUESTION_UPDATED', data: PlainCurrentQuestionMetadata } |
    { code: 'ANSWER_RECEIVED', data: { answer: string, userID: string } } |
    { code: 'ACTIVE_ROUND_ENDED' };

export type AppStateHandler = (next: [AppStateEvent, AppState], i: number) => AppState

export const handleAppStateEvent: AppStateHandler = ([stateEvent, state]) => {
    switch (stateEvent.code) {
        case 'USER_ID_SET':
            state.userID = stateEvent.data;
            return state;
        case 'ACTIVE_LOBBY_UPDATED':
            state.activeLobby = stateEvent.data;

            if (state.activeLobby) {
                state.activeLobby.isHost = state.userID === state.activeLobby.hostID;
            }

            if (state.activeLobby?.activeRound) {
                state.activeLobby.activeRound.isHost = state.userID === state.activeLobby.hostID;
            }

            return state;
        case 'ACTIVE_ROUND_UPDATED':
            if (state.activeLobby) {
                state.activeLobby.activeRound = stateEvent.data;
                state.activeLobby.activeRound.isHost = state.userID === state.activeLobby.hostID;
            }
            return state;
        case 'CURRENT_QUESTION_UPDATED':
            if (state.activeLobby && state.activeLobby.activeRound) {
                state.activeLobby.activeRound.currentQuestion = stateEvent.data;
            }
            return state;
        case 'ANSWER_RECEIVED':
            if (state.activeLobby && state.activeLobby.activeRound) {
                state.activeLobby.activeRound.leaderboard[stateEvent.data.userID].previousAnswer = stateEvent.data.answer;
            }
            return state;
        case 'ACTIVE_ROUND_ENDED':
            if (state.activeLobby) {
                state.activeLobby.activeRound = null;
            }
            return state;
    }
};

export function setupAppState(
    userID: string,
    activeLobby: PlainLobby | null,
    handler: AppStateHandler
): [Observable<AppState>, Subject<AppStateEvent>] {
    const stateEvents$ = new Subject<AppStateEvent>();

    if (activeLobby) {
        activeLobby.isHost = userID === activeLobby.hostID;

        if (activeLobby.activeRound) {
            activeLobby.activeRound.isHost = activeLobby.isHost;
        }
    }

    const state$ = new BehaviorSubject<AppState>({
        userID,
        activeLobby
    });

    stateEvents$.pipe(
        withLatestFrom(state$.pipe(map(clone))),
        map(handler)
    ).subscribe((nextState) => {
        state$.next(nextState);
    });

    return [state$, stateEvents$];
}
