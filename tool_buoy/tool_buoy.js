import {Tool3D} from "/3d_protocol/Tool3D.js"
import {ParentMessageInterface} from "/3d_protocol/WorkerFactory.js"

const letterToTexture = new Map([
    ["a", "ICS_Alfa.png"],
    ["b", "ICS_Bravo.png"],
    ["c", "ICS_Charlie.png"],
    ["d", "ICS_Delta.png"], 
    ["e", "ICS_Echo.png"],
    ["f", "ICS_Foxtrot.png"],
    ["g", "ICS_Golf.png"],
    ["h", "ICS_Hotel.png"],
    ["i", "ICS_India.png"], 
    ["j", "ICS_Juliett.png"],
    ["k", "ICS_Kilo.png"],
    ["l", "ICS_Lima.png"],
    ["m", "ICS_Mike.png"],
    ["n", "ICS_November.png"], 
    ["o", "ICS_Oscar.png"],
    ["p", "ICS_Papa.png"],
    ["q", "ICS_Quebec.png"],
    ["r", "ICS_Romeo.png"],
    ["s", "ICS_Sierra.png"], 
    ["t", "ICS_Tango.png"],
    ["u", "ICS_Uniform.png"],
    ["v", "ICS_Victor.png"],
    ["w", "ICS_Whiskey.png"],
    ["x", "ICS_X-ray.png"], 
    ["y", "ICS_Yankee.png"],
    ["z", "ICS_Zulu.png"]
])

class BuoyTool extends Tool3D {
    constructor() {
        const url = new URL(window.location.href);
        const channel = url.searchParams.get("channel");
        console.log("BuoyTool using channel: \'" + channel + "\'");
        super(channel, new ParentMessageInterface("*"));
        super.setOnMessage((msg) => this.onMessage(msg));
        this.letter = url.searchParams.get("letter");
        this.toolData = null;
        super.postMessage({command: "forceUpdate"});
    }

    onMessage(msg) {
        const data = msg.data;
        if (data.content.command === "update") {
            if (this.toolData === null) {
                this.toolData = data.content.toolData;
                this.start();
            } else {
                console.log("update ignored");
            }
        }
    }

    start() {
        if (!this.toolData.Scene.Properties.Buoy) {
            let modelUrl = "/models/flagcz.glb";
            if (this.letter === 'a' || this.letter == 'b') {
                modelUrl = "/models/flagab.glb";
            } 
            const modelMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, (Math.random() * 10.0) - 5.0, -1, (Math.random() * 10.0) - 5.0, 1]);
            this.createBuoyModel(modelUrl);
            this.setBuoyModelMatrix(modelMatrix);
            
            this.setFlagTexture(letterToTexture.get(this.letter), "/textures/" + letterToTexture.get(this.letter));
            super.postMessage({command: "write", toolData: this.toolData});
        }
    }

    createBuoyModel(modelUrl) {
         this.toolData.Scene.Properties.Buoy = {
                Meta: {
                    Type: "Object.GLTF", 
                    Url: modelUrl
                },
                Properties: {}
         }
    }

    setBuoyModelMatrix(matrix) {
        this.toolData.Scene.Properties.Buoy.Properties.ModelMatrix = {
            Meta: {Type: "Array"},
            Values: matrix
        }
    }

    setFlagTexture(name, textureUrl) {
        let textureData = {Meta: {Type: "Object"}, Properties: {}};
        textureData.Properties[name] = {Meta: { Type: "Texture.PNG", Url: textureUrl}};
        this.toolData.Textures = textureData;
        this.toolData.Scene.Properties.Buoy.Properties.Material = "Buoy.Plane001";
        let materialData = {Properties: {}};
        materialData.Properties["Buoy.Plane001"] = {Properties: {colorTexture: {Properties: {texture: name}}}};
        this.toolData.Materials = materialData;
    }
}

const tool = new BuoyTool();