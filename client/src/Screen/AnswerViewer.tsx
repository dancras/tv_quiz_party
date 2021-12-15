import React, { useEffect } from 'react';

import { useObservable } from '../Lib/RxReact';
import { CommandButtonProps } from '../Component/CommandButton';
import { QuestionTimings } from '../Model/QuestionTimer';
import Round, { CurrentQuestion } from '../Model/Round';
import { Observable } from 'rxjs';

export type AnswerViewerProps = {
    question: CurrentQuestion,
    round: Round
}

function AnswerViewer(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    currentQuestionTimings$: Observable<QuestionTimings>,
    { question, round }: AnswerViewerProps
) {
    const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);

    const timings = useObservable(currentQuestionTimings$);

    function handleAnswerButton(event: React.MouseEvent<HTMLButtonElement>) {
        const answer = event.currentTarget.getAttribute('data-answer');
        if (answer) {
            round.answerQuestion(answer);
            setSelectedAnswer(answer);
        } else {
            console.error('Missing data-answer attribute on answer');
        }
    }

    function getButtonClasses(answer: string) {
        const classes = [];

        if (selectedAnswer === answer) {
            classes.push('selected');
        }

        if (timings.revealAnswer) {
            classes.push(answer === question.correctAnswer ? 'correct-answer' : 'incorrect-answer');
        }

        return classes.join(' ');
    }

    function getContainerClasses() {
        const classes = [];

        if (selectedAnswer) {
            classes.push('has-selected');
        }

        if (timings.revealAnswer) {
            classes.push(selectedAnswer === question.correctAnswer ? 'correct' : 'incorrect');
        }

        return classes.join(' ');
    }

    useEffect(() => {
        if (timings.lockAnswers) {
            question.hasEnded$.subscribe(hasEnded => hasEnded ? void(0) : round.endQuestion()).unsubscribe();
        }
    });

    return (
        <div className={getContainerClasses()}>
            { timings.displayAnswers ?
                <>
                    <CommandButton
                        className={getButtonClasses('1')}
                        disabled={timings.lockAnswers}
                        data-answer={'1'}
                        onClick={handleAnswerButton}
                    >{question.answerText1}</CommandButton>
                    <CommandButton
                        className={getButtonClasses('2')}
                        disabled={timings.lockAnswers}
                        data-answer={'2'}
                        onClick={handleAnswerButton}
                    >{question.answerText2}</CommandButton>
                    <CommandButton
                        className={getButtonClasses('3')}
                        disabled={timings.lockAnswers}
                        data-answer={'3'}
                        onClick={handleAnswerButton}
                    >{question.answerText3}</CommandButton>
                </> :
                <></>
            }
        </div>
    );
}

export default AnswerViewer;
