import React, { useRef, useState } from 'react';
import Clipper from 'image-clipper';
import { CommandButtonProps } from '../Component/CommandButton';

export type Profile = {
    imgDataUrl: string,
    displayName: string
}

export type ProfileCmd =
    { cmd: 'UpdateProfile', data: Profile }

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
        <div>
            { profileImg !== null ?
                <div className="profile-img-preview"><img src={profileImg} alt="Preview"/></div> :
                <></>
            }
            <div>
                <label>Display Name<input ref={displayNameRef} type="text" /></label>
                <label>Upload Photo<input type="file" accept="image/*" onChange={handleImageUpload} /></label>
                <CommandButton onClick={handleUpdateProfile}>Update Profile</CommandButton>
            </div>
        </div>
    );
}

export default ProfileScreen;
