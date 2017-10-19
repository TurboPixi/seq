import * as PIXI from 'pixi.js';
import * as GlobalStyle from './GlobalStyle';

export class Visualization {
    constructor(width, height, valsNum, rotSpeedA, rotSpeedB) {
        this.display = new PIXI.Graphics();
        this.resize(width, height);
        this.valsNum = valsNum * 0.5;
        this.midVal = Math.round(this.valsNum * 0.5);
        this.averageVal = 0;
        this.vals = [];
        for(var i = 0; i < valsNum; i++) {
            this.vals[i] = 0;
        }
        this.rotationA = 0;
        this.rotationB = 0;
        this.rotationSpeedA = rotSpeedA;
        this.rotationSpeedB = rotSpeedB;
    }

    drawArc(delta, newVals) {
        var w = this.width / this.valsNum;
        var p = this.width * 0.1;
        var step = Math.PI * 2 / this.valsNum;

        for(var i = 0; i < newVals.length; i++) {
            var val = newVals[i];
            if (val > this.vals[i]) {
                this.vals[i] = val;
            }
            if (val > this.vals[this.midVal + i]) {
                this.vals[this.midVal + i] = val;
            }
            if(this.vals[i] > this.averageVal) {
                this.averageVal = this.vals[i];
            }
        }

        this.display.clear();
        for(var i = 0; i < this.valsNum; i++) {
            this.display.beginFill(GlobalStyle.getAccentColor2(), Math.abs(Math.sin((i / this.valsNum) * Math.PI * 2)) / 1.5 + 0.5);
            this.drawArcShape(this.display, this.width * 0.5, this.height * 0.5, this.outerArcMinRadius + this.vals[i] * this.outerArcAddedRadius, this.rotationA + step * i - Math.PI * 0.5, this.rotationA + step * i + step * 0.618 - Math.PI * 0.5);
            this.display.endFill();

            this.vals[i] *= 0.985;
        }

        this.display.lineStyle(0);
        this.display.beginFill(0x000000);
        this.display.drawCircle(this.width * 0.5, this.height * 0.5, this.centerRadiusBig);
        this.display.endFill();

        for(var i = 0; i < this.valsNum; i++) {
            this.display.beginFill(GlobalStyle.getAccentColor1(), Math.abs(Math.sin((i / this.valsNum) * Math.PI * 2)) / 1.5 + 0.5);
            this.drawArcShape(this.display, this.width * 0.5, this.height * 0.5, this.innerArcMinRadius + this.vals[i] * this.innerArcAddedRadius, this.rotationB + step * i, this.rotationB + step * i + step * 0.618);
            this.display.endFill();

            this.vals[i] *= 0.985;
        }

        this.display.lineStyle(0);
        this.display.beginFill(0x000000);
        this.display.drawCircle(this.width * 0.5, this.height * 0.5, this.centerRadiusSmall - this.centerRadiusSmall * this.averageVal * 0.25);
        this.display.endFill();

        this.display.beginFill(GlobalStyle.getVisualizerBarColor(), 0.5);
        this.display.drawRect(0, this.height * 0.5 - this.barHeight * 0.5, this.width, this.barHeight);
        this.display.endFill();

        this.rotationA += delta * this.rotationSpeedA;
        this.rotationB += delta * this.rotationSpeedB;
        this.averageVal *= 0.985;
    }

    drawArcShape(ctx, x, y, radius, startAngle, endAngle) {
        ctx.moveTo(x, y);
        var step = (endAngle - startAngle) / 8;
        for(var i = 0; i < 9; i++) {
            ctx.lineTo(x + Math.cos(startAngle + step * i) * radius, y + Math.sin(startAngle + step * i) * radius);
        }
        ctx.lineTo(x, y);
    }

    getDisplay() {
        return this.display;
    }

    resize(width, height, barHeight, centerRadiusSmall, centerRadiusBig, innerArcMinRadius, innerArcAddedRadius, outerArcMinRadius, outerArcAddedRadius) {
        this.width = width;
        this.height = height;
        this.barHeight = barHeight;
        this.centerRadiusSmall = centerRadiusSmall;
        this.centerRadiusBig = centerRadiusBig;
        this.innerArcMinRadius = innerArcMinRadius;
        this.innerArcAddedRadius = innerArcAddedRadius;
        this.outerArcMinRadius = outerArcMinRadius;
        this.outerArcAddedRadius = outerArcAddedRadius;
    }

    setRotationSpeed(rotationSpeedA, rotationSpeedB) {
        this.rotationSpeedA = rotationSpeedA;
        this.rotationSpeedB = rotationSpeedB;
    }
}