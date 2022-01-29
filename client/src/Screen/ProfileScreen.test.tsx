import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import { DummyCommandButton } from '../Component/CommandButton';

import ProfileScreen from './ProfileScreen';

test('it sends a command with profile img and name data', async () => {
    const mockProcessImage = jest.fn();
    const mockSendCmd = jest.fn();

    const buffer = fs.readFileSync('./public/logo512.png');
    const dummyFile = new File([buffer], 'dummy.png', { type: 'image/png' });
    const expectedProcessedImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const expectedDisplayName = 'Phil Collins';

    function ExampleProfileScreen() {
        return ProfileScreen(DummyCommandButton, mockProcessImage, mockSendCmd);
    }

    mockProcessImage.mockResolvedValue(expectedProcessedImage);

    render(<ExampleProfileScreen />);

    userEvent.upload(screen.getByLabelText('Upload Photo'), dummyFile);

    await waitFor(() => expect(mockProcessImage).toHaveBeenCalledWith(dummyFile));

    userEvent.type(screen.getByLabelText('Display Name'), expectedDisplayName);

    userEvent.click(screen.getByText('Update Profile'));

    expect(mockSendCmd).toHaveBeenCalledWith({
        cmd: 'UpdateProfile',
        data: {
            imgDataUrl: expectedProcessedImage,
            displayName: expectedDisplayName
        }
    });
});
