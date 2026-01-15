import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';
import '@babylonjs/loaders';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Color3, Color4 } from '@babylonjs/core';
import { GridSystem } from './grid';
import { UISystem } from './ui';
import { IOSystem } from './io';

class EditorApp {
    public engine: Engine;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public canvas: HTMLCanvasElement;
    
    public gridSystem: GridSystem;
    public uiSystem: UISystem;
    public ioSystem: IOSystem;

    constructor() {
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        
        // Initialize Babylon Engine
        this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        
        // Create Scene
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);

        // Setup Camera (ArcRotate for editor view)
        this.camera = new ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 3, 20, Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas, true);
        this.camera.wheelPrecision = 50;
        this.camera.minZ = 0.1;

        // Lighting
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        // Initialize Systems (placeholders for now)
        this.gridSystem = new GridSystem(this.scene);
        this.ioSystem = new IOSystem(this.gridSystem);
        this.uiSystem = new UISystem(this.gridSystem, this.ioSystem);

        // Resize event
        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        // Hide loading screen
        const loading = document.getElementById("loading");
        if (loading) loading.style.display = "none";
    }

    public run() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

// Start the editor
const editor = new EditorApp();
editor.run();
