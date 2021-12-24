import React, { useRef, useState } from 'react';
import Clipper from 'image-clipper';
import { Button, Grid, Form, Image, Container, Icon } from 'semantic-ui-react';
import { CommandButtonProps } from '../Component/CommandButton';
import { ProfileCmd } from '../Model/Profile';

export function processProfileImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const tmpUrl = URL.createObjectURL(file);
        Clipper(tmpUrl, function () {
            try {
                const { width, height } = this.getCanvas();
                const excess = height - width;

                this.crop(0, excess / 2, width, width)
                    .resize(300)
                    .toDataURL(previewUrl => {
                        resolve(previewUrl);
                        URL.revokeObjectURL(tmpUrl);
                    });
            } catch (e) {
                reject(e);
            }
        });
    });
}

function ProfileScreen(
    CommandButton: React.FunctionComponent<CommandButtonProps>,
    processImage: (file: File) => Promise<string>,
    sendCmd: (cmd: ProfileCmd) => void,
) {

    const [profileImg, setProfileImg] = useState<string | null>(null);
    const displayNameRef = useRef<HTMLInputElement | null>(null);

    function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files ? event.target.files[0] : null;

        if (file) {
            processImage(file).then(setProfileImg);
        }
    }

    function handleUpdateProfile() {
        if (profileImg && displayNameRef.current) {
            sendCmd({
                cmd: 'UpdateProfile',
                data: {
                    displayName: displayNameRef.current.value,
                    imgDataUrl: profileImg
                }
            });
        }
    }

    return (
        <Container>
            <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column textAlign='left' style={{ maxWidth: 450 }}>
                    <Form size="big">
                        { profileImg !== null ?
                            <Image centered src={profileImg} circular size='tiny' /> :
                            <></>
                        }
                        <Form.Field>
                            <label>Display Name<input ref={displayNameRef} type="text" /></label>
                        </Form.Field>
                        <Form.Field>
                            <label>
                                Upload Photo
                                <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
                                <Button
                                    fluid size='large'
                                    icon
                                    labelPosition='right'
                                    onClick={event => (event.currentTarget.previousSibling as any).click()}
                                >
                                    <Icon name='camera' />
                                    Select Photo
                                </Button>
                            </label>
                        </Form.Field>
                        <CommandButton fluid size='large' onClick={handleUpdateProfile}>Update Profile</CommandButton>
                    </Form>
                </Grid.Column>
            </Grid>
        </Container>
    );
}

export default ProfileScreen;
