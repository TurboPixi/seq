import * as GlobalStyle from './GlobalStyle';
import * as PIXI from 'pixi.js';
import TweenLite from 'gsap/TweenLite';

var mousePaintModes = {
    OFF: "off",
    ON: "on",
    NONE: "none"
}

var mousePaintMode = mousePaintModes.OFF;

export class Cell {
    constructor (size, alt, value){
        this.alt = alt;
        this.currentState = 0;
        this.numStates = 2;
        this.value = value;

        this.display = new PIXI.Sprite();
        this.display.interactive = true;

        this.background = new PIXI.Graphics();
        this.display.addChild(this.background);

        this.centerDisplayColors = [
            GlobalStyle.getDarkColor(),
            GlobalStyle.getHighlightColor()
        ];
        this.centerDisplays = [];

        for(var i = 0; i < this.numStates; i++) {
            var centerDisplay = new PIXI.Graphics();
            this.centerDisplays.push(centerDisplay);
            this.display.addChild(centerDisplay);
        }

        this.pulseDisplay = new PIXI.Graphics();
        this.display.addChild(this.pulseDisplay);

        this.resize(size);
        this.updateState();
        this.enableInteraction();
        this.pulse();
    }

    enableInteraction() {
        this.display.mousedown = this.onMouseDown.bind(this);
        this.display.touchstart = this.onMouseDown.bind(this);
        this.display.mouseover = this.onMouseOver.bind(this);
        this.display.touchend = this.onMouseOver.bind(this);
    }

    onMouseDown(event) {
        if(this.currentState == 0) {
            this.nextState();
            mousePaintMode = mousePaintModes.ON;
        } else {
            this.nextState();
            mousePaintMode = mousePaintModes.OFF;
        }
    }

    onMouseOver(event) {
        if (this.currentState == 0 && mousePaintMode == mousePaintModes.ON || this.currentState == 1 && mousePaintMode == mousePaintModes.OFF) {
            this.nextState();
        }
    }

    onMouseUp() {
        mousePaintMode = mousePaintModes.NONE;
    }

    resize(size) {
        this.size = size;
        this.makeBackground();
        this.makeCenterDisplays();
        this.makeCenterDisplay(this.pulseDisplay, 0xffffff);
    }

    makeBackground() {
        this.background.clear();
        this.background.lineStyle(GlobalStyle.getThinOutlineWidth(), this.alt ? GlobalStyle.getDarkHighlightColor() : GlobalStyle.getDarkColor());
        this.background.beginFill(0x000000, 1);
        this.background.drawRoundedRect(0, 0, this.size, this.size, this.size * 0.05);
        this.background.endFill();
    }

    makeCenterDisplays() {
        for(var i = 0; i < this.centerDisplays.length; i++) {
            this.makeCenterDisplay(this.centerDisplays[i], this.centerDisplayColors[i]);
        }
    }

    makeCenterDisplay(display, color) {
        display.clear();
        display.beginFill(color, 1);
        display.drawRect(this.size * 0.1, this.size * 0.1, this.size * 0.8, this.size * 0.8);
        display.endFill();
    }

    getDisplay() {
        return this.display;
    }

    getSize() {
        return this.size;
    }

    getCurrentState() {
        return this.currentState;
    }

    getValue() {
        return this.value;
    }

    nextState() {
        this.currentState++;
        if(this.currentState > this.numStates - 1) {
            this.currentState = 0;
        }
        this.updateState();
    }

    updateState() {
        for(var i = 0; i < this.centerDisplays.length; i++) {
            if(i != this.currentState) {
                this.centerDisplays[i].visible = false;
            } else {
                this.centerDisplays[i].visible = true;
            }
        }
    }

    setPosition(x, y) {
        this.display.x = x;
        this.display.y = y;
    }

    pulse(delay = 0) {
        this.pulseDisplay.alpha = 1;
        TweenLite.to(this.pulseDisplay, 0.75, { alpha:"0", delay: delay });
    }
}

export class Row {
    constructor(toggleButton) {
        this.cells = [];
        this.toggleButton = toggleButton;
    }

    addCell(cell) {
        this.cells.push(cell);
    }

    getNumCells() {
        return this.cells.length;
    }

    getCellAt(index) {
        return this.cells[index];
    }

    getToggleButton() {
        return this.toggleButton;
    }
}

export class TransportButton {
    constructor(size, toggledCallback) {
        this.size = size;
        this.toggledCallback = toggledCallback;

        this.display = new PIXI.Sprite();
        this.background = new PIXI.Graphics();
        this.playing = true;

        this.background.lineStyle(GlobalStyle.getThinOutlineWidth(), GlobalStyle.getDarkColor());
        this.background.beginFill(0x000000, 1);
        this.background.drawRoundedRect(0, 0, this.size, this.size, 6);
        this.background.endFill();

        this.playingDisplay = new PIXI.Graphics();
        this.playingDisplay.beginFill(GlobalStyle.getHighlightColor(), 1);
        this.playingDisplay.drawPolygon(
            [
                -this.size * 0.25, -this.size * 0.35,
                this.size * 0.25, 0,
                -this.size * 0.25, this.size * 0.35
            ]
        );
        this.playingDisplay.position.set(this.size * 0.525, this.size * 0.5);

        this.stoppedDisplay = new PIXI.Graphics();
        this.stoppedDisplay.beginFill(GlobalStyle.getHighlightColor(), 1);
        this.stoppedDisplay.drawRoundedRect(0, 0, this.size * 0.7, this.size * 0.7, 6);
        this.stoppedDisplay.endFill();
        this.stoppedDisplay.pivot.set(this.size * 0.35, this.size * 0.35);
        this.stoppedDisplay.position.set(this.size * 0.5, this.size * 0.5);

        this.display.addChild(this.background);
        this.display.addChild(this.playingDisplay);
        this.display.addChild(this.stoppedDisplay);

        this.display.interactive = true;
        this.display.click = this.onClick.bind(this);
        this.display.tap = this.onClick.bind(this);
        this.toggle();
    }

    onClick(event) {
        this.toggle();
    }

    getDisplay() {
        return this.display;
    }

    setPosition(x, y) {
        this.display.position.set(x, y);
    }

    toggle() {
        this.playing = !this.playing;
        if(this.playing) {
            this.playingDisplay.visible = false;
            this.stoppedDisplay.visible = true;
        } else {
            this.playingDisplay.visible = true;
            this.stoppedDisplay.visible = false;
        }
        this.toggledCallback(this.playing);
    }
}

export class Slider {
    constructor(width, height, valueChangedCallback, defaultText) {
        this.valueChangedCallback = valueChangedCallback;
        this.value = 0.5;
        this.hSize = width;
        this.vSize = height;
        this.borderSize = GlobalStyle.getThickOutlineWidth();
        this.mouseIsDown = false;

        this.display = new PIXI.Sprite();
        this.display.interactive = true;

        this.background = new PIXI.Graphics();
        this.background.clear();
        this.background.lineStyle(GlobalStyle.getThinOutlineWidth(), GlobalStyle.getDarkColor());
        this.background.beginFill(0x000000, 1);
        this.background.drawRoundedRect(0, 0, this.hSize, this.vSize, GlobalStyle.getRoundedRectCornerSize());
        this.background.endFill();

        this.valueDisplay = new PIXI.Graphics();

        this.textDisplay = new PIXI.Text(defaultText, {font: this.vSize * 0.5 + "px Arial", fill: GlobalStyle.getHighlightColor()});

        this.display.addChild(this.background);
        this.display.addChild(this.valueDisplay);
        this.display.addChild(this.textDisplay);

        this.display.mousedown = this.onMouseDown.bind(this);
        this.display.touchstart = this.onMouseDown.bind(this);
        this.display.mousemove = this.onMouseMove.bind(this);
        this.display.touchend = this.onMouseMove.bind(this);

        this.updateDisplay();
    }

    onMouseDown(event) {
        this.setValue(Math.min(1, Math.max(0, event.data.getLocalPosition(this.display).x / this.hSize)));
        this.mouseIsDown = true;
    }

    onMouseMove(event) {
        if(this.mouseIsDown) {
            this.setValue(Math.min(1, Math.max(0, event.data.getLocalPosition(this.display).x / this.hSize)));
        }
    }

    onMouseUp() {
        this.mouseIsDown = false;
    }

    getDisplay() {
        return this.display;
    }

    setPosition(x, y) {
        this.display.position.set(x, y);
    }

    setValue(val) {
        this.value = val;
        this.updateDisplay();
        this.valueChangedCallback(this.value);
    }

    setTextDisplay(textVal) {
        this.textDisplay.setText(textVal);
    }

    updateDisplay() {
        var rightEdgeXPos = Math.max(0, this.hSize * this.value - this.borderSize * 2);
        this.valueDisplay.clear();
        this.valueDisplay.beginFill(GlobalStyle.getDarkColor(), 1);
        this.valueDisplay.drawRect(this.borderSize, this.borderSize, rightEdgeXPos, this.vSize - this.borderSize * 2);
        this.valueDisplay.endFill();
        this.textDisplay.position.set(Math.max(this.hSize * 0.025, rightEdgeXPos - this.textDisplay.width), this.vSize * 0.2);
    }
}

export class ToggleButton {
    constructor(size, index) {
        this.size = size;
        this.index = index;
        this.isOn = false;

        this.display = new PIXI.Sprite();
        this.display.interactive = true;
        this.background = new PIXI.Graphics();
        this.toggle = new PIXI.Graphics();

        this.background.beginFill(0x000000);
        this.background.lineStyle(GlobalStyle.getThinOutlineWidth(), GlobalStyle.getDarkColor());
        this.background.drawCircle(0, 0, size);

        this.toggle.beginFill(GlobalStyle.getHighlightColor(), 1);
        this.toggle.drawCircle(0, 0, this.size * 0.75);

        this.display.addChild(this.background);
        this.display.addChild(this.toggle);

        this.toggleState();

        this.display.click = this.onClick.bind(this);
        this.display.tap = this.onClick.bind(this);
    }

    onClick(event) {
        this.toggleState();
    }

    setPosition(x, y) {
        this.display.position.set(x, y);
    }

    getDisplay() {
        return this.display;
    }

    getIndex() {
        return this.index;
    }

    getIsOn() {
        return this.isOn;
    }

    toggleState() {
        this.isOn = !this.isOn;
        if(this.isOn) {
            this.toggle.visible = true;
        } else {
            this.toggle.visible = false;
        }
    }
}