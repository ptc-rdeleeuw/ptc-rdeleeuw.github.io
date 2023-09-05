import * as THREE from "https://unpkg.com/three@0.156.1/build/three.module.min.js";
import {OrbitControls} from "https://unpkg.com/three@0.156.1/examples/jsm/controls/OrbitControls.js";
import Stats from "https://unpkg.com/three@0.156.1/examples/jsm/libs/stats.module.js";
import {GLTFLoader} from "https://unpkg.com/three@0.156.1/examples/jsm/loaders/GLTFLoader.js";
import {ThreejsToolEngine3D, ThreejsEngine3D} from "/3d_protocol/ThreejsEngine3D.js";
import {IFrameFactory} from "/3d_protocol/WorkerFactory.js";
import {VRButton} from "https://unpkg.com/three@0.156.1/examples/jsm/webxr/VRButton.js";
import initialWorld from "/metaverse.json" assert {type: "json" };

const gltfLoader = new GLTFLoader();

class ThreejsClient {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.3, 1000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.camera.translateZ(20);
        this.controls.update();

        const directionalLight = new THREE.DirectionalLight(0xfff4d6, 1);
        directionalLight.translateOnAxis(new THREE.Vector3(0, 1, 1), 3);
        this.scene.add(directionalLight);

        this.resize();

        this.groundPlane = new THREE.Group();
        this.scene.add(this.groundPlane);

        this.engine3D = new ThreejsEngine3D(this.scene, this.groundPlane, initialWorld);
        this.toolFactory = new IFrameFactory();

        // initialize tools from file
        if (initialWorld.World && initialWorld.World.Tools) {
            const toolnames = Object.keys(initialWorld.World.Tools);
            for(const toolname of toolnames) {
                const toolmeta = initialWorld.World.Tools[toolname].Meta;
                if (toolmeta.Type.startsWith("Tool")) {
                    const channel = toolname;
                    let toolurl = toolmeta.Url;
                    if (toolmeta.Url.includes("?")) {
                        toolurl += "&channel=" + channel;
                    } else {
                        toolurl += "?channel=" + channel;
                    }
                    const messageInterface = this.toolFactory.createIFrame(toolurl, "*");
                    this.engine3D.addTool(channel, messageInterface);
                }
            }
        }

        // intialize "newly created" tools
        const newBuoys = ["c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        for (const buoyLetter of newBuoys) {
            const channel = "Buoy" + buoyLetter.toUpperCase();
            const messageInterface = this.toolFactory.createIFrame("/tool_buoy/tool_buoy.html?letter=" + buoyLetter + "&channel=" + channel, "*");
            this.engine3D.addTool(channel, messageInterface);
        }
        
		document.body.appendChild(VRButton.createButton(this.renderer));
		this.renderer.xr.enabled = true;

        this.renderer.setAnimationLoop(() => animate());
    }

    /**
     * 
     * @param {HTMLElement} rootElement 
     */
    async start(rootElement) {
        rootElement.appendChild(this.renderer.domElement);
    }

    /**
     * 
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        this.controls.update();
    }

    render () {
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}


const clock = new THREE.Clock();        
const stats = Stats();
const client = new ThreejsClient();

function animate() {
    client.update(clock.getDelta());
    client.render();

    stats.update();
}

document.addEventListener("DOMContentLoaded", (event) => {
    const content = document.getElementById("content")
    if (content !== null) {
        client.start(content);
        content.appendChild(stats.dom);
    }
}, false);

window.addEventListener("resize", (event) => {
    client.resize();
}, false);

