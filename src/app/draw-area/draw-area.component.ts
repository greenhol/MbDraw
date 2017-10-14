import { Component, ViewEncapsulation, OnInit, ElementRef, HostListener } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import {
  ColorFct,
  mapToLinearColorValue,
  mapToSqrtColorValue,
  mapToSmoothValue,
  mapToSmoothPeriodicValue
} from '../colorMaps';

interface Complex {
  real: number;
  imag: number;
}

interface Config {
  zStart: Complex;
  zEnd: Complex;
  zoomLevel: number;
}

interface Coordinate {
  x: number;
  y: number;
}

// const CANVAS_WIDTH = 9600;
// const CANVAS_HEIGHT = 5400;
// const CANVAS_WIDTH = 1920;
// const CANVAS_HEIGHT = 1080;
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
const ZOOM_PERCENTAGE = 0.5;
const REAL_RANGE1 = -3;
const REAL_RANGE2 = 1.8;
const IMAG_RANGE1 = -1.35;
const IMAG_RANGE2 = 1.35;

@Component({
  selector: 'mb-draw-area',
  template: ``,
  styleUrls: ['./draw-area.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DrawAreaComponent implements OnInit {

  private d3: D3;
  private canvas: any;

  private zStart: Complex;
  private zEnd: Complex;
  private zRange: Complex;
  private zoomLevel = 1;

  private static isInMbMaybe(z: Complex, iterations: number, colorFct: ColorFct): number {

    let z0r = z.real;
    let z0i = z.imag;
    let z1r: number;
    let z1i: number;
    let abs: number;

    for (let i = 0; i < iterations; i++) {
      z1r = z0r*z0r - z0i*z0i;
      z1i = 2*z0r*z0i;
      z1r += z.real;
      z1i += z.imag;
      abs = Math.sqrt(z1r*z1r + z1i*z1i);
      if (abs > 2) {
        return colorFct(i, iterations);
      } else {
        z0r = z1r;
        z0i = z1i;
      }
    }
    return colorFct(0, iterations);
  }

  @HostListener('mousewheel', ['$event']) onMouseWheelChrome(event: any) {
    const zoomIn = (event.deltaY < 0);
    const factor = zoomIn ? ZOOM_PERCENTAGE : 1 / ZOOM_PERCENTAGE;
    this.zoomLevel = zoomIn ? this.zoomLevel+1 : this.zoomLevel-1;
    this.panZoom({
      x: event.offsetX,
      y: event.offsetY
    }, factor);
  }

  @HostListener('pointerup', ['$event'])
  public pointerup(event: PointerEvent) {
    // only left button
    if (event.button === 0) {
      this.panZoom({
        x: event.offsetX,
        y: event.offsetY
      }, 1);
    } else if (event.button === 1) {
      window.location.href = '/';
    }
  }

  constructor(private element: ElementRef, d3Service: D3Service) {
    this.d3 = d3Service.getD3();
    let initialConfig: Config;
    try {
      initialConfig = JSON.parse(window.location.hash.substr(1));
    } catch (error) {
      initialConfig = {
        zStart: {
          real: REAL_RANGE1,
          imag: IMAG_RANGE1
        },
        zEnd: {
          real: REAL_RANGE2,
          imag: IMAG_RANGE2
        },
        zoomLevel: 1
      };
    }
    this.zoomLevel = initialConfig.zoomLevel;    
    this.setPlane(initialConfig.zStart, initialConfig.zEnd);
  }

  ngOnInit() {
    this.canvas = this.d3.select(this.element.nativeElement)
      .append('canvas')
      .classed('canvasArea', true)
      .attr('width', CANVAS_WIDTH)
      .attr('height', CANVAS_HEIGHT)
      .node();

    this.calcAndDraw();
  }

  private calcAndDraw() {
    const ctx = this.canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const iterations = (this.zoomLevel < 2) ? 255 : 255 + this.zoomLevel * 32;
    const colorFct = (iterations < 300) ? mapToLinearColorValue : mapToSmoothPeriodicValue;    

    let buf = new ArrayBuffer(imageData.data.length);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);

    this.d3.range(CANVAS_HEIGHT)
      .map((d0, y) => this.d3.range(CANVAS_WIDTH)
      .map((d1, x) => {
        let z = this.pixelToMath({x: x, y: y});
        let value = DrawAreaComponent.isInMbMaybe(z, iterations, colorFct);
        data[y * CANVAS_WIDTH + x] = 
          (255 << 24) |       // alpha
          (value << 16) |     // blue
          (value << 8) |      // green
          value;              // red
      }));
    
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);  
  }

  private panZoom(center: Coordinate, factor: number) {
    const diffX = factor * CANVAS_WIDTH / 2;
    const diffY = factor * CANVAS_HEIGHT / 2;
    const coord1: Coordinate = {
      x: center.x - diffX,
      y: center.y + diffY
    };
    const coord2: Coordinate = {
      x: center.x + diffX,
      y: center.y - diffY
    };
    this.setPlane(this.pixelToMath(coord1), this.pixelToMath(coord2));
    this.calcAndDraw();
  }

  private setPlane(zStart: Complex, zEnd: Complex) {
    this.zStart = zStart;
    this.zEnd = zEnd;
    this.zRange = {
      real: zEnd.real - zStart.real,
      imag: zEnd.imag - zStart.imag
    }
    this.setConfig();
  }

  private setConfig() {
    const newConfig: Config = {
      zStart: this.zStart,
      zEnd: this.zEnd,
      zoomLevel: this.zoomLevel
    }
    window.location.hash = JSON.stringify(newConfig);
  }

  private pixelToMath(coordinate: Coordinate): Complex {
    return {
      real: this.zRange.real * coordinate.x / CANVAS_WIDTH + this.zStart.real,
      imag: this.zEnd.imag - this.zRange.imag * coordinate.y / CANVAS_HEIGHT
    }
  }
}
