import {MessageInterface} from "./WorkerFactory.js"
import {Engine3DMessage} from "./protocol.js";

/**
 * @callback onMessageFunc
 * @param {Object} message
 * @returns {void}
 */

/**
 * @typedef {Float32Array} Vector3
 * @typedef {Float32Array} Matrix4x4
 */

class ObjectId {
    constructor() {

    }
}

class Engine3D {
    constructor(initialWorld) {
        this.world = initialWorld;
    }

    onWindowResized(width, height) {
        throw new Error("Interface Engine3D not implemented");
    }

    onContextLost() {
        throw new Error("Interface Engine3D not implemented");
    }

    onContextRestored() {
        throw new Error("Interface Engine3D not implemented");
    }
}

class ToolEngine3D { 
    /**
     * 
     * @param {string} name 
     * @param {MessageInterface} messageInterface
     */
    constructor(name, messageInterface, toolData) {
        this.name = name;
        this.messageInterface = messageInterface;
        this.messageInterface.setOnMessage((msg) => this.onMessage(msg));
        this.onMessageCallback = null;
        this.toolData = toolData;
    }

     /**
     * 
     * @param {string} _url
     * @return {ObjectId}   
     */
    async addGLTF(_name, _url) {
        throw new Error("Interface Engine3D not implemented");
    }

    addTexture(_name, _url) {
        throw new Error("Interface Engine3D not implemented");
    }

    /**
     * 
     * @param {Matrix4x4} matrix 
     */
    setLocalMatrix(matrix) {
        throw new Error("Interface Engine3D not implemented");
    }

    /**
     * 
     * @param {number} width 
     * @param {number} height 
     */
    onWindowResized(width, height) {
        this.postMessage({command: "onWindowResized", width: width, height: height});
    } 

    onContextLost() {
        this.postMessage({command: "onContextLost"});
    } 

    onContextRestored() {
        this.postMessage({command: "onContextRestored"});
    } 

    /**
     * 
     * @param {Object} content 
     */
    postMessage(content) {
        this.messageInterface.postMessage(new Engine3DMessage(this.name, content));
    }

    /**
     * 
     * @param {MessageEvent} msg 
     */
    onMessage(msg) {
        const data = msg.data;
        if (data.origin && data.origin.type && data.origin.type === "Tool3D") {
            if (data.origin.name === this.name) {
                if (data.content.command === "forceUpdate") {
                    this.postMessage({command: "update", toolData: this.toolData})
                } else if (data.content.command === "write") {
                    const clientToolData = data.content.toolData;
                    if (clientToolData.Textures) {
                        for (const textureName of Object.keys(clientToolData.Textures.Properties)) {
                            const clientTextureData = clientToolData.Textures.Properties[textureName];
                            if (clientTextureData.Meta && clientTextureData.Meta.Type === "Texture.PNG") {
                                if (!this.toolData.Textures) {
                                    this.toolData.Textures = {Meta: {Type: "Object"}, Properties: {}};
                                }
                                this.toolData.Textures.Properties[textureName] = clientTextureData;
                                this.addTexture(textureName, clientTextureData.Meta.Url);
                            }
                        }
                    }
                    for (const objName of Object.keys(clientToolData.Scene.Properties)) {
                        const clientObjectData = clientToolData.Scene.Properties[objName];
                        if (clientObjectData.Meta && clientObjectData.Meta.Type === "Object.GLTF") {
                            this.toolData.Scene.Properties[objName] = clientObjectData;
                            this.addGLTF(objName, clientObjectData.Meta.Url);
                        }
                        if (clientObjectData.Properties) {
                            if (clientObjectData.Properties.ModelMatrix) {
                                this.toolData.Scene.Properties[objName].Properties.ModelMatrix = clientObjectData.Properties.ModelMatrix;
                                this.setLocalMatrix(clientObjectData.Properties.ModelMatrix.Values);
                            } 
                            if (clientObjectData.Properties.Material) {
                                if (!this.toolData.Materials) {
                                    this.toolData.Materials = {Meta: {Type: "Object"}, Properties: {}};
                                }
                                if (this.toolData.Materials.Properties[clientObjectData.Properties.Material]) {
                                    this.updateMaterial(clientObjectData.Properties.Material, clientToolData.Materials.Properties[clientObjectData.Properties.Material])
                                } else {
                                    this.toolData.Materials.Properties[clientObjectData.Properties.Material] = clientToolData.Materials.Properties[clientObjectData.Properties.Material];
                                }
                            }
                        }
                    }
                } 
            }
        } 
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

export {Engine3D, ToolEngine3D}