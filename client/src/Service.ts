import { Subject } from 'rxjs';

import { post, subscribeToServer } from './Lib/Request';

import { AppStateEvent } from './AppState';
import { PlainLobby } from './Model/Lobby';
import { PlainCurrentQuestionMetadata, Question } from './Model/CurrentQuestion';
import { LeaderboardItem, PlainRound } from './Model/Round';

export type ServerMessage =
    { code: 'USER_JOINED', data: any } |
    { code: 'USER_EXITED', data: any } |
    { code: 'LOBBY_CLOSED', data: null } |
    { code: 'ROUND_STARTED', data: any } |
    { code: 'QUESTION_STARTED', data: any } |
    { code: 'ANSWER_RECEIVED', data: any } |
    { code: 'ROUND_ENDED', data: any };

export type HandshakeData = {
    userID: string,
    activeLobby: PlainLobby | null,
    timeOffset: number
};

export function doHandshake(): Promise<HandshakeData> {
    const handshakeSendTime = Date.now();
    return post('/api/handshake')
        .then(x => x.json())
        .then(handshakeData => {
            const handshakeReceivedTime = Date.now();
            const serverTime = handshakeData['utc_time'] * 1000;
            const sendTime = serverTime - handshakeSendTime;
            const receiveTime = handshakeReceivedTime - serverTime;
            const timeOffset = sendTime - ((sendTime + receiveTime) / 2);

            const lobbyData = handshakeData['active_lobby'];

            return {
                userID: handshakeData['user_id'],
                activeLobby: lobbyData ? createLobbyFromLobbyData(lobbyData) : null,
                timeOffset
            };
        });
}

export function createLobby(stateEvents$: Subject<AppStateEvent>): Promise<any> {
    return post('/api/create_lobby')
        .then(response => response.json())
        .then((lobbyData) => {
            stateEvents$.next({
                code: 'ACTIVE_LOBBY_UPDATED',
                data: createLobbyFromLobbyData(lobbyData)
            });
        });
}

export function joinLobby(stateEvents$: Subject<AppStateEvent>, joinCode: string, presenter?: boolean): Promise<any> {
    if (presenter) {
        return fetch(`/api/get_lobby/${joinCode}`)
            .then(response => response.json())
            .then((lobbyData) => {
                const lobby = createLobbyFromLobbyData(lobbyData);
                lobby.isPresenter = true;

                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: lobby
                });
            });
    } else {
        return post('/api/join_lobby', {
                join_code: joinCode
            })
            .then(response => response.json())
            .then((lobbyData) => {
                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: createLobbyFromLobbyData(lobbyData)
                });
            });
    }
}

export function exitLobby(lobbyID: string) {
    post(`/api/lobby/${lobbyID}/exit`);
}

export function startRound(lobbyID: string) {
    post(`/api/lobby/${lobbyID}/start_round`);
}

export function startNextQuestion(lobbyID: string, currentQuestionIndex: number | undefined) {
    post(`/api/lobby/${lobbyID}/start_question`, {
        question_index: currentQuestionIndex !== undefined ? currentQuestionIndex + 1 : 0
    });
}

export function answerQuestion(lobbyID: string, questionIndex: number, answer: string) {
    post(`/api/lobby/${lobbyID}/answer_question`, {
        question_index: questionIndex,
        answer
    });
}

export function endQuestion(lobbyID: string, questionIndex: number) {
    post(`/api/lobby/${lobbyID}/end_question`, {
        question_index: questionIndex,
    });
}

export function setupLobbyWebSocket(stateEvents$: Subject<AppStateEvent>, id: string) {
    return subscribeToServer(`/api/lobby/${id}/ws`, (event) => {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.code) {
            case 'USER_JOINED':
            case 'USER_EXITED':
                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: createLobbyFromLobbyData(message.data.lobby)
                });
                break;
            case 'LOBBY_CLOSED':
                stateEvents$.next({
                    code: 'ACTIVE_LOBBY_UPDATED',
                    data: null
                });
                break;
            case 'ROUND_STARTED':
                stateEvents$.next({
                    code: 'ACTIVE_ROUND_UPDATED',
                    data: createRoundFromRoundData(message.data)
                });
                break;
            case 'QUESTION_STARTED':
                stateEvents$.next({
                    code: 'CURRENT_QUESTION_UPDATED',
                    data: createPlainCurrentQuestionMetadata(message.data)
                });
                break;
            case 'ANSWER_RECEIVED':
                stateEvents$.next({
                    code: 'ANSWER_RECEIVED',
                    data: {
                        answer: message.data['answer'],
                        userID: message.data['user_id']
                    }
                });
                break;
            case 'ROUND_ENDED':
                // TODO: Some kind of pending previous round state?
                break;
            default:
                // "Not assignable to never" error indicates non-exhaustive switch
                const checkExhaustive: never = message;
                console.error('Unhandled ServerMessage', checkExhaustive);
        }
    });
}

function createLobbyFromLobbyData(lobbyData: any): PlainLobby {
    return {
        id: lobbyData['id'] as string,
        hostID: lobbyData['host_id'] as string,
        joinCode: lobbyData['join_code'] as string,
        users: lobbyData['users'],
        activeRound: lobbyData['round'] && createRoundFromRoundData(lobbyData['round']),
        isHost: false,
        isPresenter: false
    };
}

function createRoundFromRoundData(roundData: any): PlainRound {
    return {
        questions: roundData['questions'].map(createQuestionFromQuestionData),
        currentQuestion: roundData['current_question'] ? createPlainCurrentQuestionMetadata(roundData['current_question']) : null,
        isHost: false,
        leaderboard: Object.fromEntries(Object.entries(roundData['leaderboard']).map(([k, v]: any): [string, LeaderboardItem] => [k, {
            previousAnswer: ''
        }]))
    };
}

function createPlainCurrentQuestionMetadata(currentQuestionData: any): PlainCurrentQuestionMetadata {
    return {
        i: currentQuestionData['i'],
        startTime: currentQuestionData['start_time'] * 1000,
        hasEnded: currentQuestionData['has_ended']
    };
}

function createQuestionFromQuestionData(questionData: any): Question {
    return {
        videoID: questionData['video_id'] as string,
        questionStartTime: questionData['start_time'] as number,
        questionDisplayTime: questionData['question_display_time'] as number,
        answerLockTime: questionData['answer_lock_time'] as number,
        answerRevealTime: questionData['answer_reveal_time'] as number,
        endTime: questionData['end_time'] as number,
        answerText1: questionData['answer_text_1'] as string,
        answerText2: questionData['answer_text_2'] as string,
        answerText3: questionData['answer_text_3'] as string,
        correctAnswer: questionData['correct_answer'] as string,
    };
}
