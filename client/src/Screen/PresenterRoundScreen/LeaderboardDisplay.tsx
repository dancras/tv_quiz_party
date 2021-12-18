import { useEffect, useState } from 'react';
import { QuestionTimingsHook } from '../../Hook/QuestionTimingsHook';
import { useObservable } from '../../Lib/RxReact';
import CurrentQuestion from '../../Model/CurrentQuestion';
import { Leaderboard, LeaderboardItem } from '../../Model/Round';

export type LeaderboardDisplayProps = {
    currentQuestion: CurrentQuestion,
    leaderboard: Leaderboard
};

function LeaderboardDisplay(
    useQuestionTimings: QuestionTimingsHook<CurrentQuestion>,
    { currentQuestion, leaderboard }: LeaderboardDisplayProps
) {
    const hasEndedOnServer = useObservable(currentQuestion?.hasEndedOnServer$);
    const timings = useQuestionTimings(currentQuestion);
    const [leaderboardForDisplay, setLeaderboardForDisplay] = useState(leaderboard);

    function getAnswerClasses(item: LeaderboardItem) {
        if (timings.revealAnswer) {
            return item.previousAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect';
        } else {
            return '';
        }
    }

    useEffect(() => {
        if (timings.revealAnswer) {
            setLeaderboardForDisplay(leaderboard);
        }
    }, [timings.revealAnswer, leaderboard]);

    return (
        <table className="leaderboard">
            <tbody>
                <tr>
                    <td>Name</td>
                    <td>Score</td>
                    <td>Position</td>
                    <td>Answer</td>
                </tr>
                { Object.entries(leaderboardForDisplay).map(([userID, item]) =>
                    <tr key={userID}>
                        <td>{userID}</td>
                        <td>{item.score}</td>
                        <td>{item.position}</td>
                        { hasEndedOnServer ?
                            <td className={getAnswerClasses(item)}>{item.previousAnswer}</td> :
                            <td></td>
                        }
                    </tr>
                ) }
            </tbody>
        </table>
    );
}

export default LeaderboardDisplay;
