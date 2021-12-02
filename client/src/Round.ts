export type PlainRound = {
    questions: Question[]
};

export type Question = {
    videoID: string,
    startTime: number,
    questionDisplayTime: number,
    answerLockTime: number,
    answerRevealTime: number,
    endTime: number,
    answerText1: string,
    answerText2: string,
    answerText3: string,
    correctAnswer: string
};

export class Round {
    questions: Question[];

    constructor(initial: PlainRound) {
        this.questions = initial.questions;
    }
};

export default Round;
