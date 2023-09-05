import * as THREE from "https://unpkg.com/three@0.156.1/build/three.module.js"
import {GLTFLoader} from "https://unpkg.com/three@0.156.1/examples/jsm/loaders/GLTFLoader.js"
import {Engine3D, ToolEngine3D} from "./Engine3D.js"

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

class ThreejsEngine3D extends Engine3D {
    constructor(scene, groundPlane, initialWorld) {
        super(initialWorld)
        this.scene = scene;
        this.groundPlane = groundPlane;
        this.tools = new Map();
        if (initialWorld.World && initialWorld.World.Tools) {
            const toolnames = Object.keys(initialWorld.World.Tools);
            for(const toolname of toolnames) {
                const toolmeta = initialWorld.World.Tools[toolname].Meta;
                if (toolmeta.Type.startsWith("Tool")) {
                    const toolOrigin = new THREE.Group();
                    toolOrigin.name = toolname;
                    this.groundPlane.add(toolOrigin);   
                }
            }
        }
    }

    async addTool(name, messageInterface) {
        let toolOrigin = null;
        let toolData = null;
        for (const child of this.groundPlane.children) {
            if (child.name && child.name === name) {
                toolOrigin = child;
                toolData = this.world.World.Tools[name].Properties
                break;
            }
        }
        if (toolOrigin == null) { 
            toolOrigin = new THREE.Group();
            toolOrigin.name = name;
            this.groundPlane.add(toolOrigin);
            toolData = {Scene: {Meta: {Type: "Object"}, Properties: {}}};
            this.world.World.Tools[name] = {Meta: {Type: "Tool"}, Properties: toolData}
        }
        this.tools.set(name, new ThreejsToolEngine3D(name, messageInterface, this.scene, toolOrigin, toolData))
    }

    onWindowResized(width, height) {
        this.tools.forEach((value, _key, _map) => value.onWindowResized(width, height));
    }

    onContextLost() {
        this.tools.forEach((value, _key, _map) => value.onContextLost());
    }

    onContextRestored() {
        this.tools.forEach((value, _key, _map) => value.onContextRestored());
    }
}

class ThreejsToolEngine3D  extends ToolEngine3D {
    constructor(name, messageInterface, scene, toolOrigin, toolData) {
        super(name, messageInterface, toolData);
        this.scene = scene;
        this.toolOrigin = toolOrigin;
        this.materials = new Map();
        this.textures = new Map();
        this.onMessage({data: {origin: {type: "Tool3D", name: name}, content: {command: "write", toolData: toolData}}});
    }

    async addGLTF(name, url) {
        const model = await new Promise((resolve, reject) => {
            gltfLoader.load(url, (modelData) => resolve(modelData), null, reject);
        });
        this.toolOrigin.add(model.scene);
        this.toolData.Scene.Properties[name].Children = {Meta: {Type: "Object"}, Properties: {}};
        for (const child of model.scene.children) {
            const subMeshName = child.name;
            let subMeshData = {Meta: {Type: "Object"}, Properties: {}};
            if (child.material) {
                subMeshData.Properties.Material = name + "." + child.name;
                this.addMaterial(subMeshData.Properties.Material, child.material); 
            }
            this.toolData.Scene.Properties[name].Children.Properties[subMeshName] = subMeshData;    
        }
    }

    async addTexture(name, url) {
        const texture = textureLoader.load(url);
        this.textures.set(name, texture);
        if (!this.toolData.Textures) {
            this.toolData.Textures = {Meta: {Type: "Object"}, Properties: {}};
        }
        this.toolData.Textures.Properties[name] = {Meta: {Type: "Texture.PNG", Url: url}};
    }
    
    addMaterial(name, material) {
        this.materials.set(name, material);
        if (!this.toolData.Materials) {
            this.toolData.Materials = {Meta: {Type: "Object"}, Properties: {}};
        }
        let materialProperties = {}
        if (material.isMeshStandardMaterial) {
            if (material.map === null) {
                materialProperties.colorTexture = {Meta: {Type: "Object"}, Properties: {internalName: "map", texture: null}};  
            } else {
                materialProperties.colorTexture = {Meta: {Type: "Object"}, Properties: {internalName: "map", texture: name + "." + material.map.name}};
                this.addTextureInternal(name + "." + material.map.name, material.map);
            }
            if (this.toolData.Materials.Properties[name]) {
                const savedProperties = this.toolData.Materials.Properties[name].Properties;
                if (savedProperties.colorTexture) {
                    const textureName = savedProperties.colorTexture.Properties.texture;
                    materialProperties.colorTexture.Properties.texture = textureName;
                    if (textureName) {
                        material[materialProperties.colorTexture.Properties.internalName] = this.textures.get(textureName);
                    }
                }
            }
        }
        this.toolData.Materials[name] = {Meta: {Type: "Object"}, Properties: materialProperties};
    }

    updateMaterial(name, materialData) {
        let material = this.materials.get(name);
        if (materialData.Properties.colorTexture) {
            const textureName = materialData.Properties.colorTexture.Properties.texture;
            this.toolData.Materials[name].Properties.colorTexture.Properties.texture = textureName;
            if (textureName) {
                material[this.toolData.Materials[name].Properties.colorTexture.Properties.internalName] = this.textures.get(textureName);    
            }
        }
    }

    addTextureInternal(name, texture) {
        this.textures.set(name, texture);
        if (!this.toolData.Textures) {
            this.toolData.Textures = {Meta: {Type: "Object"}, Properties: {}};
        }
        this.toolData.Textures.Properties[name] = {Meta: {Type: "Texture.Internal"}};
    }

    /**
     * 
     * @param {Float32Array} networkMatrix 
     * @returns {THREE.Matrix4}
     */
    networkToThreejsMatrix(networkMatrix) {
        return new THREE.Matrix4().fromArray(networkMatrix);
    }

    /**
     * 
     * @param {Float32Array} networkMatrix 
     */
    setLocalMatrix(networkMatrix) {
        this.networkToThreejsMatrix(networkMatrix).decompose(this.toolOrigin.position, this.toolOrigin.rotation, this.toolOrigin.scale);
    }

    onWindowResized(width, height) {
        super.onWindowResized(width, height);
    }

    onContextLost() {
        super.onContextLost();
    }

    onContextRestored() {
        super.onContextRestored();
    }
}

export {ThreejsEngine3D, ThreejsToolEngine3D}