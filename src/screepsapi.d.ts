interface Decorations {
    ok: number;
    decorations: DecorationObject[];
}

interface DecorationObject {
    _id: string;
    user: string;
    active: ActiveDecoration;
    decoration: Decoration;
}

interface ActiveDecoration {
    strokeWidth: string;
    foregroundColor: string;
    foregroundAlpha: number;
    backgroundColor: string;
    backgroundBrightness: string;
    strokeColor: string;
    strokeBrightness: number;
    strokeLighting: string;
    foregroundBrightness: string;
    world: boolean;
    tileScale: number;
    shard: string;
    room: string;
}

type DecorationType = 'floorLandscape' | 'wallGraffiti' | 'wallLandscape' | 'creep';

interface Decoration {
    _id: string;
    graphics: unknown[];
    description: string;
    rarityMultiplier: number;
    type: DecorationType;
    theme: string;
    rarity: number;
    name: string;
    group: string;
    steamItemDefId: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
    enabled: boolean;
}

interface FloorLandscapeDecoration extends Decoration {
    type: 'floorLandscape';
    floorForegroundUrl: string;
}

interface WallLandscapeDecoration extends Decoration {
    type: 'wallLandscape';
    foregroundUrl: string;
}

interface WallGraffitiDecoration extends Decoration {
    type: 'wallGraffiti';
    graphics: WallGraffitiGraphics[];
}

interface WallGraffitiGraphics {
    url: string;
    color: string;
    visible: string;
}

interface CreepDecoration extends Decoration {
    type: 'creep';
    url: string;
}
