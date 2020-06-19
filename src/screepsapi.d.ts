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

interface Decoration {
    _id: string;
    graphics: unknown[];
    description: string;
    rarityMultiplier: number;
    type: string;
    theme: string;
    rarity: number;
    name: string;
    group: string;
    foregroundUrl: string;
    steamItemDefId: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
    enabled: boolean;
}