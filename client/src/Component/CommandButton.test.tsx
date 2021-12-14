import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandButton, { CommandButtonProps } from './CommandButton';

let useAreCommandsDisabled: jest.MockedFunction<() => boolean>;

function ComposedCommandButton(
    props: CommandButtonProps
) {
    return CommandButton(useAreCommandsDisabled, props);
}

beforeEach(() => {
    useAreCommandsDisabled = jest.fn();
    useAreCommandsDisabled.mockReturnValue(false);
});

test('it calls the onClick prop on button clicks', () => {
    const onClickSpy = jest.fn();

    render(<ComposedCommandButton onClick={onClickSpy}>Click Me</ComposedCommandButton>);

    const buttonElement = screen.getByText('Click Me');
    expect(buttonElement).toBeInTheDocument();

    userEvent.click(buttonElement);
    expect(onClickSpy).toBeCalled();
});

test('it disables when useAreCommandsDisabled is true', () => {
    const onClickSpy = jest.fn();

    useAreCommandsDisabled.mockReturnValue(true);

    render(<ComposedCommandButton disabled={false} onClick={onClickSpy}>Click Me</ComposedCommandButton>);

    const buttonElement = screen.getByText('Click Me');
    expect(buttonElement).toBeDisabled();
});

test('it disables when passed disabled attribute is true', () => {
    const onClickSpy = jest.fn();

    useAreCommandsDisabled.mockReturnValue(false);

    render(<ComposedCommandButton disabled={true} onClick={onClickSpy}>Click Me</ComposedCommandButton>);

    const buttonElement = screen.getByText('Click Me');
    expect(buttonElement).toBeDisabled();
});
