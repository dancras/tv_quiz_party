import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';

import Round, { CurrentQuestionMetadata, Question } from './Round';
import PresenterRoundScreen, { RoundScreenProps } from './PresenterRoundScreen';
import { QuestionViewerProps } from './QuestionViewer';

let DummyQuestionViewer: React.FunctionComponent<QuestionViewerProps>;
let useCurrentQuestion: jest.MockedFunction<() => CurrentQuestionMetadata & Question | null>;

function ExamplePresenterRoundScreen(
    props : RoundScreenProps
) {
    return PresenterRoundScreen(
        DummyQuestionViewer,
        useCurrentQuestion,
        props
    );
}

beforeEach(() => {
    DummyQuestionViewer = () => <div>QuestionViewer</div>;

    useCurrentQuestion = jest.fn();
    useCurrentQuestion.mockReturnValue(null);
});

test('QuestionViewer is shown for current question data', () => {
    const mockRound = mock<Round>();
    useCurrentQuestion.mockReturnValue({
        i: 0,
        hasEnded: true,
        videoID: '',
        startTime: 0,
        questionStartTime: 0,
        questionDisplayTime: 0,
        answerLockTime: 0,
        answerRevealTime: 0,
        endTime: 0,
        answerText1: '',
        answerText2: '',
        answerText3: '',
        correctAnswer: ''
    });

    render(<ExamplePresenterRoundScreen round={mockRound} />);

    expect(screen.getByText('QuestionViewer')).toBeInTheDocument();
});
