import React, { useEffect } from 'react';
import { CommandButtonProps } from '../Component/CommandButton';
import { QuestionTimingsHook } from '../Hook/QuestionTimingsHook';
import CurrentQuestion from '../Model/CurrentQuestion';
import Round from '../Model/Round';

export type AnswerViewerProps = {
    question: CurrentQuestion,
    round: Round
}

function AnswerViewer(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    useQuestionTimings: QuestionTimingsHook<CurrentQuestion>,
    { question, round }: AnswerViewerProps
) {
    const [selectedAnswerIndex, setSelectedAnswerIndex] = React.useState<number | null>(null);

    const timings = useQuestionTimings(question);

    function handleAnswerButton(event: React.MouseEvent<HTMLButtonElement>) {
        const answerData = event.currentTarget.getAttribute('data-answer');
        if (answerData !== null) {
            const answerIndex = parseInt(answerData);
            question.answerQuestion(answerIndex);
            setSelectedAnswerIndex(answerIndex);
        } else {
            console.error('Missing data-answer attribute on answer');
        }
    }

    function getButtonClasses(answerIndex: number) {
        const classes = [];

        if (selectedAnswerIndex === answerIndex) {
            classes.push('selected');
        }

        if (timings.revealAnswer) {
            classes.push(answerIndex === question.correctAnswerIndex ? 'correct-answer' : 'incorrect-answer');
        }

        return classes.join(' ');
    }

    function getContainerClasses() {
        const classes = [];

        if (selectedAnswerIndex !== null) {
            classes.push('has-selected');
        }

        if (timings.revealAnswer) {
            classes.push(selectedAnswerIndex === question.correctAnswerIndex ? 'correct' : 'incorrect');
        }

        return classes.join(' ');
    }

    useEffect(() => {
        if (timings.lockAnswers) {
            question.hasEndedOnServer$.subscribe(hasEnded => hasEnded ? void(0) : round.lockQuestion()).unsubscribe();
        }
    });

    return (
        <div className={getContainerClasses()}>
            { timings.displayAnswers ?
                <>
                    { question.answerOptions.map((value, i) =>
                        <CommandButton
                            key={'answerOption' + i}
                            className={getButtonClasses(i)}
                            disabled={timings.lockAnswers}
                            data-answer={i}
                            onClick={handleAnswerButton}
                        >{value}</CommandButton>
                    ) }
                </> :
                <></>
            }
        </div>
    );
}

export default AnswerViewer;
