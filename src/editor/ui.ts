import { AdvancedDynamicTexture, Control, StackPanel, Button, TextBlock, InputText, Rectangle } from '@babylonjs/gui';
import { GridSystem, TileType } from './grid';
import { IOSystem } from './io';

export class UISystem {
    private gridSystem: GridSystem;
    private ioSystem: IOSystem;
    private advancedTexture: AdvancedDynamicTexture;
    private selectedButton: Button | null = null;

    constructor(gridSystem: GridSystem, ioSystem: IOSystem) {
        this.gridSystem = gridSystem;
        this.ioSystem = ioSystem;
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        this.createSidebar();
    }

    private createSidebar() {
        const panel = new StackPanel();
        panel.width = "220px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        panel.background = "#333333";
        panel.paddingRight = "10px";
        panel.paddingTop = "10px";
        panel.paddingBottom = "10px";
        
        // Background for panel
        const rect = new Rectangle();
        rect.width = "240px";
        rect.height = "100%";
        rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        rect.background = "#222222";
        rect.thickness = 0;
        this.advancedTexture.addControl(rect);
        rect.addControl(panel);

        this.addHeader(panel, "TOOLS");
        
        this.createToolButton(panel, "Stone Wall", TileType.StoneWall);
        this.createToolButton(panel, "Brick Wall", TileType.BrickWall);
        this.createToolButton(panel, "Wood Wall", TileType.WoodWall);
        this.createToolButton(panel, "Door", TileType.Door);
        
        this.addSpacer(panel);
        this.addHeader(panel, "ENTITIES");
        
        this.createActionButton(panel, "Player Spawn", () => {
            this.gridSystem.currentTool = 'spawn';
            this.updateSelection(null); // Visual update handled differently for action buttons?
        });

        this.createActionButton(panel, "Enemy: Draugr", () => {
            this.gridSystem.currentTool = 'enemy';
            this.gridSystem.currentEnemyType = 'draugr';
            this.updateSelection(null);
        });

        this.createActionButton(panel, "Enemy: Bandit", () => {
            this.gridSystem.currentTool = 'enemy';
            this.gridSystem.currentEnemyType = 'bandit';
            this.updateSelection(null);
        });

        this.addSpacer(panel);
        this.addHeader(panel, "MAP CONFIG");
        
        // Map Size Inputs
        this.createInputRow(panel, "Width:", this.gridSystem.width.toString(), (val) => {
            const w = parseInt(val);
            if (!isNaN(w) && w > 0) this.gridSystem.resetMap(w, this.gridSystem.height);
        });
        
        this.createInputRow(panel, "Height:", this.gridSystem.height.toString(), (val) => {
            const h = parseInt(val);
            if (!isNaN(h) && h > 0) this.gridSystem.resetMap(this.gridSystem.width, h);
        });

        this.addSpacer(panel);
        this.addHeader(panel, "VIEW");
        
        this.createSystemButton(panel, "Toggle Grid", () => {
            this.gridSystem.toggleGrid();
        }, "#607D8B");

        this.addSpacer(panel);
        this.addHeader(panel, "FILE");

        this.createSystemButton(panel, "Save JSON", () => {
            this.ioSystem.downloadLevel();
        }, "#4CAF50");

        this.createSystemButton(panel, "Load JSON", () => {
            this.ioSystem.loadFromFile();
        }, "#2196F3");

        this.createSystemButton(panel, "Reset Map", () => {
            if (confirm("Clear map?")) {
                this.gridSystem.resetMap(this.gridSystem.width, this.gridSystem.height);
            }
        }, "#F44336");
        
        // Instructions
        this.addSpacer(panel);
        const instructions = new TextBlock();
        instructions.text = "L-Click: Place\nR-Click: Delete";
        instructions.color = "white";
        instructions.fontSize = "12px";
        instructions.height = "40px";
        panel.addControl(instructions);
    }

    private addHeader(panel: StackPanel, text: string) {
        const header = new TextBlock();
        header.text = text;
        header.height = "30px";
        header.color = "#AAAAAA";
        header.fontSize = "14px";
        header.fontWeight = "bold";
        panel.addControl(header);
    }

    private addSpacer(panel: StackPanel) {
        const spacer = new Rectangle();
        spacer.height = "20px";
        spacer.thickness = 0;
        panel.addControl(spacer);
    }

    private createToolButton(panel: StackPanel, label: string, toolType: TileType) {
        const button = Button.CreateSimpleButton("btn_" + label, label);
        button.width = "100%";
        button.height = "40px";
        button.color = "white";
        button.background = "#444444";
        button.cornerRadius = 5;
        button.paddingBottom = "5px";
        
        button.onPointerUpObservable.add(() => {
            this.gridSystem.currentTool = toolType;
            this.updateSelection(button);
        });
        
        panel.addControl(button);
        
        // Select first tool by default
        if (!this.selectedButton) {
            this.updateSelection(button);
        }
    }
    
    private createActionButton(panel: StackPanel, label: string, action: () => void) {
        const button = Button.CreateSimpleButton("btn_" + label, label);
        button.width = "100%";
        button.height = "40px";
        button.color = "white";
        button.background = "#444444";
        button.cornerRadius = 5;
        button.paddingBottom = "5px";
        
        button.onPointerUpObservable.add(() => {
            action();
            this.updateSelection(button);
        });
        
        panel.addControl(button);
    }

    private createSystemButton(panel: StackPanel, label: string, action: () => void, color: string) {
        const button = Button.CreateSimpleButton("btn_" + label, label);
        button.width = "100%";
        button.height = "40px";
        button.color = "white";
        button.background = color;
        button.cornerRadius = 5;
        button.paddingBottom = "5px";
        
        button.onPointerUpObservable.add(() => {
            action();
        });
        
        panel.addControl(button);
    }

    private updateSelection(button: Button | null) {
        if (this.selectedButton) {
            this.selectedButton.background = "#444444";
        }
        if (button) {
            button.background = "#666666";
            this.selectedButton = button;
        }
    }
    
    private createInputRow(panel: StackPanel, labelText: string, defaultVal: string, onChange: (val: string) => void) {
        const row = new StackPanel();
        row.isVertical = false;
        row.height = "40px";
        row.paddingBottom = "5px";
        
        const label = new TextBlock();
        label.text = labelText;
        label.width = "70px";
        label.color = "white";
        label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        row.addControl(label);
        
        const input = new InputText();
        input.width = "130px";
        input.text = defaultVal;
        input.color = "white";
        input.background = "#222222";
        input.onBlurObservable.add(() => {
            onChange(input.text);
        });
        row.addControl(input);
        
        panel.addControl(row);
    }
}
