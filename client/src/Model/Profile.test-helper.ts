export function createProfile(id: string, displayName?: string, imageFilename?: string) {
    return {
        userID: id,
        displayName: displayName ? displayName : '',
        imageFilename: imageFilename ? imageFilename : ''
    };
}
