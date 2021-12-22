import { useEffect, useState } from 'react';
import { QuestionTimingsHook } from '../../Hook/QuestionTimingsHook';
import { useObservable } from '../../Lib/RxReact';
import CurrentQuestion from '../../Model/CurrentQuestion';
import { Profile } from '../../Model/Profile';
import { Leaderboard, LeaderboardItem } from '../../Model/Round';

export type LeaderboardDisplayProps = {
    currentQuestion: CurrentQuestion,
    leaderboard: Leaderboard,
    users: Record<string, Profile>
};

function LeaderboardDisplay(
    useQuestionTimings: QuestionTimingsHook<CurrentQuestion>,
    { currentQuestion, leaderboard, users }: LeaderboardDisplayProps
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

    function getProfileImageSrc(profile: Profile): string {
        return '/api/profile_images/' + profile.imageFilename;
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
                    <td></td>
                    <td>Name</td>
                    <td>Score</td>
                    <td>Position</td>
                    <td>Answer</td>
                </tr>
                { Object.entries(leaderboardForDisplay).map(([userID, item]) =>
                    <tr key={userID}>
                        <td><img className="profile-img" src={getProfileImageSrc(users[userID])} alt={users[userID].displayName} /></td>
                        <td>{users[userID].displayName}</td>
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
