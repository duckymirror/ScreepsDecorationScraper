export function isFloorLandscapeDecoration(decoration: Decoration):
    decoration is FloorLandscapeDecoration {
    return decoration.type === 'floorLandscape';
}

export function isWallLandscapeDecoration(decoration: Decoration):
    decoration is WallLandscapeDecoration {
    return decoration.type === 'wallLandscape';
}

export function isWallGraffitiDecoration(decoration: Decoration):
    decoration is WallGraffitiDecoration {
    return decoration.type === 'wallGraffiti';
}
