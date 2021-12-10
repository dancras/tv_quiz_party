import React from 'react';

export type CommandButtonProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>;

function CommandButton(
    useAreCommandsDisabled: () => boolean,
    { children, disabled, ...props }: CommandButtonProps
) {
    const areCommandsDisabled = useAreCommandsDisabled();

    return <button disabled={areCommandsDisabled || disabled} {...props}>{children}</button>;
}

export default CommandButton;
