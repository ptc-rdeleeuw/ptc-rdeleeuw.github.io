import {MessageInterface} from "./WorkerFactory.js"
import {Tool3DMessage} from "./protocol.js";

/**
 * @callback onMessageFunc
 * @param {MessageEvent} message
 * @returns {void}
 */

class Tool3D { 
    /**
     * 
     * @param {string} name 
     * @param {MessageInterface} messageInterface
     */
    constructor(name, messageInterface) {
        this.name = name;
        this.messageInterface = messageInterface;
        this.messageInterface.setOnMessage((msg) => this.onMessage(msg));
        this.onMessageCallback = null;
        this.toolOrigin = null;
    }

    /**
     * 
     * @param {Object} content 
     */
    postMessage(content) {
        this.messageInterface.postMessage(new Tool3DMessage(this.name, content));
    }

    /**
     * 
     * @param {MessageEvent} msg 
     */
    onMessage(msg) {
        
        if (this.onMessageCallback) {
            this.onMessageCallback(msg);
        }
    }

    /**
     * 
     * @param {onMessageFunc} callback 
     */
    setOnMessage(callback) {
        this.onMessageCallback = callback;
    }
}

export {Tool3D}