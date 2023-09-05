class MessageOrigin {
    /**
     * 
     * @param {string} type 
     * @param {string} name 
     */
    constructor(type, name) {
        this.type = type;
        this.name = name;
    }
}

class Tool3DMessage {
    /**
     * 
     * @param {string} name 
     * @param {Object} content 
     */
    constructor(name, content) {
        this.origin = new MessageOrigin("Tool3D", name);
        this.content = content;
    }
}

class Engine3DMessage {
    /**
     * 
     * @param {string} name
     * @param {Object} content 
     */
    constructor(name, content) {
        this.origin = new MessageOrigin("Engine3D", name);
        this.content = content;
    }
}

export {MessageOrigin, Tool3DMessage, Engine3DMessage}