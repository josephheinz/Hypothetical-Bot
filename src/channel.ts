export type ownerId = number;

export class Channel {
    public users: Set<string>;
    public channelId: number;
    public messages: Record<number, Message>;

    constructor(channelId: number) {
        this.channelId = channelId;
        this.messages = {};
        this.users = new Set<string>();
    }

    addUser(id: string) {
        this.users.add(id);
    }

    addMessage(ts: number, text: string, owner: ownerId, reactions = 1) {
        this.messages[ts] = new Message(text, owner, reactions);
    }
}

export class Message {
    public text: string;
    public owner: ownerId;
    public reactions: number;

    constructor(text: string, owner: ownerId, reactions: number) {
        this.text = text;
        this.owner = owner;
        this.reactions = reactions;
    }
}
