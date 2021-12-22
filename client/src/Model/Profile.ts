export type Profile = {
    userID: string,
    displayName: string,
    imageFilename: string
}

export type UpdateProfileData = {
    imgDataUrl: string,
    displayName: string
}

export type ProfileCmd =
    { cmd: 'UpdateProfile', data: UpdateProfileData }
