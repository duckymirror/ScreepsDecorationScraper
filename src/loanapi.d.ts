interface LOANRooms {
    [roomName: string]: LOANRoom;
}

interface LOANRoom {
    owner: string;
    level: number;
}