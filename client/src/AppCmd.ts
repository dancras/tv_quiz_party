import { Observable, Subject, withLatestFrom } from 'rxjs';
import { AppState, AppStateEvent } from './AppState';
import { LobbyCmd } from './Model/Lobby';
import { ProfileCmd } from './Screen/ProfileScreen';
import {
    createLobby,
    getLobbyByJoinCode,
    joinLobby,
    exitLobby,
    startRound,
    startNextQuestion,
    answerQuestion,
    endQuestion
} from './Service';

export type AppCmd = LobbyCmd | ProfileCmd;

export type AppCmdHandler = ([cmd, state]: [AppCmd, AppState]) => AppCmd | void;

export function setupCmdBus(
    state$: Observable<AppState>,
    handler: AppCmdHandler
) {
    const cmds$ = new Subject<AppCmd>();

    cmds$.pipe(
        withLatestFrom(state$)
    ).subscribe(([cmd, state]) => {
        const nextCmd = handler([cmd, state]);

        if (nextCmd) {
            cmds$.next(nextCmd);
        }
    });

    return cmds$;
}

export function handleAppCmd(stateEvents$: Subject<AppStateEvent>, [cmd, state]: [AppCmd, AppState]): AppCmd | void {

    let guard_index = 0;
    function guard<T>(value: T | null): value is T {
        if (value === null) {
            console.error('Command failed: Guard found null value', guard_index, cmd.cmd, state);
            return false;
        } else {
            guard_index++;
            return true;
        }
    }

    switch (cmd.cmd) {
        case 'CreateLobby':
            if (state.isProfileComplete) {
                createLobby().then(lobby => {
                    stateEvents$.next({
                        code: 'ACTIVE_LOBBY_UPDATED',
                        data: lobby
                    });
                });
            } else {
                stateEvents$.next({
                    code: 'REQUIRE_PROFILE_COMPLETE',
                    data: cmd
                });
            }
            break;

        case 'JoinLobby':
            if (cmd.isPresenter) {
                getLobbyByJoinCode(cmd.joinCode).then(lobby => {
                    lobby.isPresenter = true;
                    stateEvents$.next({
                        code: 'ACTIVE_LOBBY_UPDATED',
                        data: lobby
                    });
                });
            } else if (state.isProfileComplete) {
                // TODO rejection locks the UI
                joinLobby(cmd.joinCode).then(lobby => {
                    stateEvents$.next({
                        code: 'ACTIVE_LOBBY_UPDATED',
                        data: lobby
                    });
                });
            } else {
                stateEvents$.next({
                    code: 'REQUIRE_PROFILE_COMPLETE',
                    data: cmd
                });
            }
            break;

        case 'ExitLobby':
            if (guard(state.activeLobby)) {
                if (state.activeLobby.isPresenter) {
                    stateEvents$.next({
                        code: 'ACTIVE_LOBBY_UPDATED',
                        data: null
                    });
                    break;
                } else {
                    exitLobby(state.activeLobby.id);
                }
            }
            break;

        case 'StartRound':
            if (guard(state.activeLobby)) {
                startRound(state.activeLobby.id);
            }
            break;

        case 'StartNextQuestion':

            if (guard(state.activeLobby) && guard(state.activeLobby.activeRound)) {
                startNextQuestion(state.activeLobby.id, state.activeLobby.activeRound.currentQuestion?.i);
            }
            break;

        case 'AnswerQuestion':
            if (guard(state.activeLobby) && guard(state.activeLobby.activeRound) && guard(state.activeLobby.activeRound.currentQuestion)) {
                answerQuestion(state.activeLobby.id, state.activeLobby.activeRound.currentQuestion.i, cmd.data);
            }
            break;

        case 'LockQuestion':
            if (guard(state.activeLobby) && guard(state.activeLobby.activeRound) && guard(state.activeLobby.activeRound.currentQuestion)) {
                if (state.activeLobby.isHost) {
                    endQuestion(state.activeLobby.id, state.activeLobby.activeRound.currentQuestion.i);
                }

                state.activeLobby.activeRound.currentQuestion.hasEnded = true;
                stateEvents$.next({
                    code: 'CURRENT_QUESTION_UPDATED',
                    data: state.activeLobby.activeRound.currentQuestion
                });
            }
            break;

        case 'EndQuestion':
            stateEvents$.next({
                code: 'CLEAR_PREVIOUS_ANSWERS'
            });
            break;

        case 'EndFinalQuestion':
            stateEvents$.next({
                code: 'ACTIVE_ROUND_ENDED'
            });
            break;

        case 'UpdateProfile':
            const pendingCommand = state.pendingCommand;
            stateEvents$.next({
                code: 'UPDATE_PROFILE'
            });
            if (pendingCommand) {
                return pendingCommand;
            }
            break;

        default:
            const checkExhaustive: never = cmd;
            console.error('Unhandled Command', checkExhaustive);
    }
}
