import { Cell } from './UI';
import { Row } from './UI';
import { Slider } from './UI';
import { TransportButton } from './UI';
import { Visualization } from './Visualization';
import { ToggleButton } from './UI';
import * as GlobalStyle from './GlobalStyle';
import Tone from 'tone';
import * as PIXI from 'pixi.js';
import TweenLite from 'gsap/TweenLite';

window.onload = function() {
    var project = new Project();
}

const DOMAIN = "https://jfred1979.github.io";

class Project {
    constructor() {
        this.init();
    }

    init() {
        this.prevTimeMS = -1;

        this.data = {
            rows: [
                {
                    samples: [
                        {
                            id: "0",
                            val: "0.35",
                            path: "assets/audio/01.mp3"
                        }
                    ]
                },
                {
                    samples: [
                        {
                            id: "1",
                            val: "0.35",
                            path: "assets/audio/02.mp3"
                        }
                    ]
                },
                {
                    samples: [
                        {
                            id: "2",
                            val: "0.45",
                            path: "assets/audio/03.mp3"
                        }
                    ]
                },
                {
                    samples: [
                        {
                            id: "3",
                            val: "0.5",
                            path: "assets/audio/04.mp3"
                        }
                    ]
                },
                {
                    samples: [
                        {
                            id: "4",
                            val: "0.65",
                            path: "assets/audio/05.mp3"
                        }
                    ]
                },
                {
                    samples: [
                        {
                            id: "5",
                            val: "0.5",
                            path: "assets/audio/06.mp3"
                        }
                    ]
                }
            ]
        };

        this.setupPIXI();
        this.setupSound();

        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
    }

    setupSound() {
        this.waveDataInc = 0;
        this.waveData = [];
        for(var i = 0; i < this.data.rows.length; i++) {
            this.waveData[i] = 0;
        }

        this.pattern = new Tone.Sequence(
            this.onStep.bind(this), [
                "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"
            ],
            "8n"
        );

        var playerData = {};
        for(var i = 0; i < this.data.rows.length; i++) {
            var sampleData = this.data.rows[i].samples;
            for(var n = 0; n < sampleData.length; n++) {
                playerData[sampleData[n].id] = sampleData[n].path;
            }
        }

        this.player = new Tone.MultiPlayer(
            playerData,
            function() {
                this.pattern.start(0);
                this.draw();
                this.onWindowResize();
                if(window.parent != undefined) {
                    window.postMessage("initComplete", DOMAIN);
                }
                TweenLite.to(this.visualization.getDisplay(), 0.75, { alpha:"1" });
                TweenLite.to(this.cellContainer, 0.75, { alpha:"1" });
            }.bind(this)
        );
        this.player.toMaster();
    }

    onStep(time, note) {
        for(var i = 0; i < this.rows.length; i++) {
            if(this.rows[i].getToggleButton().getIsOn()) {
                var cell = this.rows[i].getCellAt(note);
                if (cell.getCurrentState() > 0) {
                    this.player.start(i, time);
                    this.waveData[i + this.waveDataInc % this.rows.length] = cell.getValue();
                }
                cell.pulse();
            }
        }
        this.waveDataInc++;
        if(this.waveDataInc >= this.rows.length) {
            this.waveDataInc = 0;
        }
    }

    setupPIXI() {
        this.renderer = new PIXI.WebGLRenderer(GlobalStyle.getTargetWidth(), GlobalStyle.getTargetHeight(), { antialias: true });

        //Add the canvas to the HTML document
        document.body.appendChild(this.renderer.view);

        //Create a container object called the `stage`
        this.renderer.autoResize = true;
        this.renderer.view.style.position = "absolute";
        this.renderer.view.style.display = "block";
        this.stage = new PIXI.Container();
        this.stage.interactive = true;

        this.visualization = new Visualization(GlobalStyle.getTargetWidth(), GlobalStyle.getTargetHeight(), GlobalStyle.getVisualizerBandsNum(), this.getRotSpeedA(0.5), this.getRotSpeedB(0.5));
        this.visualization.getDisplay().alpha = 0;
        this.stage.addChild(this.visualization.getDisplay());

        this.cellContainer = new PIXI.Container();
        this.cellContainer.alpha = 0;
        this.stage.addChild(this.cellContainer);
        this.rows = [];
        this.rowsNum = this.data.rows.length;
        for(var i = 0; i < this.rowsNum; i++) {
            var row = new Row(new ToggleButton(20, i));
            var alt = false;
            for(var n = 0; n < GlobalStyle.getCellsNum(); n++) {
                if(n % 4 == 0) {
                    alt = !alt;
                }
                var cell = new Cell(GlobalStyle.getCellSize(), alt, this.data.rows[i].samples[0].val);
                this.cellContainer.addChild(cell.getDisplay());
                row.addCell(cell);
            }
            this.cellContainer.addChild(row.getToggleButton().getDisplay());
            this.rows[i] = row;
        }

        this.transportButton = new TransportButton(GlobalStyle.getCellSize(), this.transportToggle.bind(this));
        this.cellContainer.addChild(this.transportButton.getDisplay());

        this.bpm = new Slider((GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize()) * 5 - GlobalStyle.getCellPaddingSize(), GlobalStyle.getCellSize(), this.onValueChanged.bind(this), this.getBPM(0.5) + " bpm");
        this.cellContainer.addChild(this.bpm.getDisplay());

        this.updateLayout();

        this.heightToWidth = this.cellContainer.height / this.cellContainer.width;
        this.widthToHeight = this.cellContainer.width / this.cellContainer.height;

        this.stage.mouseup = this.mouseUpHandler.bind(this);
        this.stage.touchend = this.mouseUpHandler.bind(this);
    }

    mouseUpHandler(event) {
        this.bpm.onMouseUp();
        for(var i = 0; i < this.rowsNum; i++) {
            for (var n = 0; n < GlobalStyle.getCellsNum(); n++) {
                var cell = this.rows[i].getCellAt(n);
                cell.onMouseUp();
            }
        }
    }

    updateLayout() {
        var rowWidth = ((GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize()) * GlobalStyle.getCellsNum() - GlobalStyle.getCellPaddingSize());

        for(var i = 0; i < this.rowsNum; i++) {
            var yPos = (GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize()) * i;
            var row = this.rows[i].getToggleButton().setPosition(-40, yPos + GlobalStyle.getCellSize() * 0.5);
            for(var n = 0; n < GlobalStyle.getCellsNum(); n++) {
                var cell = this.rows[i].getCellAt(n);
                cell.setPosition((cell.getSize() + GlobalStyle.getCellPaddingSize()) * n, (cell.getSize() + GlobalStyle.getCellPaddingSize()) * i);
                cell.resize(GlobalStyle.getCellSize());
            }
        }
        this.cellContainer.pivot.set(rowWidth * 0.5, ((GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize()) * this.rowsNum - GlobalStyle.getCellPaddingSize()) * 0.5);

        var transportX = GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize();
        var transportY = (GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize()) * this.rowsNum + GlobalStyle.getCellSize() * 0.5;
        this.transportButton.setPosition(transportX * 5, transportY);
        this.bpm.setPosition(transportX * 6, transportY);
    }

    getBPM(val) {
        return Math.round(60 + val * 120);
    }

    getRotSpeedA(val) {
        return 0.035 + 0.1 * val;
    }

    getRotSpeedB(val) {
        return 0.085 + 0.15 * val;
    }

    transportToggle(isPlaying) {
        if(isPlaying) {
            Tone.Transport.start();
        } else {
            Tone.Transport.stop();
        }
    }

    onValueChanged(value) {
        var val = this.getBPM(value);
        this.bpm.setTextDisplay(val + " bpm");
        Tone.Transport.bpm.value = val;
        this.visualization.setRotationSpeed(this.getRotSpeedA(value), this.getRotSpeedB(value));
    }

    draw() {
        this.currentTimeMS = Date.now();
        if(this.prevTimeMS != -1) {
            this.deltaTimeSeconds = (this.currentTimeMS - this.prevTimeMS) / 1000;
        } else {
            this.deltaTimeSeconds = 0;
        }

        this.elapsedSeconds += this.deltaTimeSeconds;
        this.prevTimeMS = this.currentTimeMS;

        this.visualization.drawArc(this.deltaTimeSeconds, this.waveData);
        for(var i = 0; i < this.waveData.length; i++) {
            this.waveData[i] = 0;
        }
        this.renderer.render(this.stage);

        requestAnimationFrame(this.draw.bind(this));
    }

    onWindowResize(){
        var width = GlobalStyle.getWidth();
        var height = GlobalStyle.getHeight();

        var transportOffset = GlobalStyle.getCellSize() + GlobalStyle.getCellPaddingSize() * 2;
        var sizeToWidth = width * 0.85 * this.heightToWidth + transportOffset < height;

        this.cellContainer.width = sizeToWidth ? width * 0.85 : height * 0.75 * this.widthToHeight;
        this.cellContainer.height = sizeToWidth ? width * 0.85 * this.heightToWidth : height * 0.75;
        this.cellContainer.position.set(width * 0.5, height * 0.5);

        this.visualization.resize(
            width,//width
            height,//height
            this.cellContainer.height * 0.15,//barHeight
            this.cellContainer.height * 0.512,//centerRadiusSmall
            this.cellContainer.height * 0.704,//centerRadiusBig
            this.cellContainer.height * 0.576,//innerArcMinRadius
            this.cellContainer.height * 0.64,//innerArcAddedRadius
            this.cellContainer.height * 0.8,//outerArcMinRadius
            this.cellContainer.height * 0.64,//outerArcAddedRadius
        );
    }
}