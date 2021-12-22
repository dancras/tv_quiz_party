import { Subject, BehaviorSubject, withLatestFrom, map, Observable } from 'rxjs';
import clone from 'just-clone';
import { LobbyCmd, PlainLobby } from './Model/Lobby';
import { Leaderboard, PlainRound } from './Model/Round';
import { PlainCurrentQuestionMetadata } from './Model/CurrentQuestion';
import { Profile } from './Model/Profile';

export type AppState = {
    userID: string,
    activeLobby: PlainLobby | null,
    pendingCommand: LobbyCmd | null,
    profile: Profile | null
};
export type AppStateEvent =
    { code: 'USER_ID_SET', data: string } |
    { code: 'ACTIVE_LOBBY_UPDATED', data: PlainLobby | null } |
    { code: 'ACTIVE_ROUND_UPDATED', data: PlainRound } |
    { code: 'CURRENT_QUESTION_UPDATED', data: PlainCurrentQuestionMetadata } |
    { code: 'ANSWER_RECEIVED', data: { answer: string, userID: string } } |
    { code: 'LEADERBOARD_UPDATED', data: Leaderboard } |
    { code: 'CLEAR_PREVIOUS_ANSWERS' } |
    { code: 'ACTIVE_ROUND_ENDED' } |
    { code: 'REQUIRE_PROFILE_COMPLETE', data: LobbyCmd } |
    { code: 'UPDATE_PROFILE', data: Profile };

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
        case 'LEADERBOARD_UPDATED':
            if (state.activeLobby && state.activeLobby.activeRound) {
                const activeRound = state.activeLobby.activeRound;
                Object.entries(stateEvent.data).forEach(([userID, item]) => {
                    activeRound.leaderboard[userID].position = item.position;
                    activeRound.leaderboard[userID].score = item.score;
                });
            }
            return state;
        case 'CLEAR_PREVIOUS_ANSWERS':
            if (state.activeLobby && state.activeLobby.activeRound) {
                const leaderboard = state.activeLobby.activeRound.leaderboard;
                Object.entries(leaderboard).forEach(([userID,]) => {
                    leaderboard[userID].previousAnswer = '';
                });
            }
            return state;
        case 'ACTIVE_ROUND_ENDED':
            if (state.activeLobby) {
                state.activeLobby.activeRound = null;
            }
            return state;
        case 'REQUIRE_PROFILE_COMPLETE':
            state.pendingCommand = stateEvent.data;
            return state;
        case 'UPDATE_PROFILE':
            state.pendingCommand = null;
            state.profile = stateEvent.data;
            return state;
    }
};

export function setupAppState(
    userID: string,
    activeLobby: PlainLobby | null,
    profile: Profile | null,
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
        activeLobby,
        profile,
        pendingCommand: null
    });

    stateEvents$.pipe(
        withLatestFrom(state$.pipe(map(clone))),
        map(handler)
    ).subscribe((nextState) => {
        state$.next(nextState);
    });

    return [state$, stateEvents$];
}
