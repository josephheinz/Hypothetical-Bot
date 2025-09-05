class Channel {
    constructor(channelId) {
        this.channelId = channelId;
        this.messages = {};
        this.users = new Set();
    }

    addUser(id) {
        this.users.add(id);
    }

    addMessage(ts, text, owner, reactions = 1) {
        this.messages[ts] = new Message(text, owner, reactions);
    }
}

class Message {
    constructor(text, owner, reactions) {
        this.text = text;
        this.owner = owner;
        this.reactions = reactions;
    }
}

module.exports = { Channel, Message };