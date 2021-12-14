import { render, screen } from '@testing-library/react';
import { mock } from 'jest-mock-extended';

import Round, { CurrentQuestion } from './Model/Round';
import PresenterRoundScreen, { RoundScreenProps } from './PresenterRoundScreen';
import { QuestionViewerProps } from './QuestionViewer';

import { createCurrentQuestion } from './Model/Round.test';

let DummyQuestionViewer: React.FunctionComponent<QuestionViewerProps>;
let useCurrentQuestion: jest.MockedFunction<() => CurrentQuestion | null>;

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
    useCurrentQuestion.mockReturnValue(createCurrentQuestion());

    render(<ExamplePresenterRoundScreen round={mockRound} />);

    expect(screen.getByText('QuestionViewer')).toBeInTheDocument();
});
