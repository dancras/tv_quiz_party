import { Observable, Subject, withLatestFrom } from 'rxjs';
import { AppState, AppStateEvent } from './AppState';
import { LobbyCmd } from './Lobby';
import { exitLobby, startRound, startNextQuestion, answerQuestion, endQuestion } from './Service';

export type AppCmd = LobbyCmd;

export type AppCmdHandler = ([cmd, state]: [AppCmd, AppState]) => void;

export function setupCmdBus(
    state$: Observable<AppState>,
    handler: AppCmdHandler
) {
    const cmds$ = new Subject<AppCmd>();

    cmds$.pipe(
        withLatestFrom(state$)
    ).subscribe(handler);

    return cmds$;
}

export function handleAppCmd(stateEvents$: Subject<AppStateEvent>, [cmd, state]: [AppCmd, AppState]) {

    if (state.activeLobby) {
        switch (cmd.cmd) {
            case 'ExitLobby':
                exitLobby(state.activeLobby.id);
                break;

            case 'StartRound':
                startRound(state.activeLobby.id);
                break;

            case 'StartNextQuestion':
                if (state.activeLobby.activeRound) {
                    startNextQuestion(state.activeLobby.id, state.activeLobby.activeRound.currentQuestion?.i);
                } else {
                    console.error('Command failed: No activeRound', cmd.cmd, state);
                }
                break;

            case 'AnswerQuestion':
                if (state.activeLobby.activeRound && state.activeLobby.activeRound.currentQuestion) {
                    answerQuestion(state.activeLobby.id, state.activeLobby.activeRound.currentQuestion.i, cmd.data);
                } else {
                    console.error('Command failed: No activeRound or currentQuestion', cmd.cmd, state);
                }
                break;

            case 'EndQuestion':
                if (state.activeLobby.activeRound && state.activeLobby.activeRound.currentQuestion) {
                    if (state.activeLobby.isHost) {
                        endQuestion(state.activeLobby.id, state.activeLobby.activeRound.currentQuestion.i);
                    }

                    state.activeLobby.activeRound.currentQuestion.hasEnded = true;
                    stateEvents$.next({
                        code: 'CURRENT_QUESTION_UPDATED',
                        data: state.activeLobby.activeRound.currentQuestion
                    });
                } else {
                    console.error('Command failed: No activeRound or currentQuestion', cmd.cmd, state);
                }
                break;

            default:
                const checkExhaustive: never = cmd;
                console.error('Unhandled Command', checkExhaustive);
        }
    } else {
        console.error('Command failed: No activeLobby', cmd.cmd, state);
    }
}
