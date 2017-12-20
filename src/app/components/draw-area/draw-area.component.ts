import { Component, ViewEncapsulation, OnInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { saveAs } from 'file-saver';
import { Dimension, DIMENSIONS, Resolution } from '../../data/dimensions';
import { ColorMap, Color } from '../../data/color-map';

export interface Complex {
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

const ZOOM_PERCENTAGE = 0.5;

@Component({
  selector: 'mb-draw-area',
  templateUrl: './draw-area-component.html',
  styleUrls: ['./draw-area.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DrawAreaComponent implements OnInit {

  private readonly RES: Resolution = DIMENSIONS._16x10;
  private readonly DIM: Dimension = this.RES.s;
  private config: Config;
  private zRange: Complex;

  // private colorMap: ColorMap;

  private colorMap: ColorMap = new ColorMap(
    [
      {r: 0, g: 0, b: 0},
      {r: 255, g: 255, b: 255},
      {r: 0, g: 0, b: 0}
    ], 256);

  // private colorMap: ColorMap = new ColorMap(
  //   [
  //     {r: 0, g: 0, b: 0},
  //     {r: 128, g: 0, b: 0},
  //     {r: 255, g: 64, b: 0},
  //     {r: 255, g: 128, b: 0},
  //     {r: 255, g: 64, b: 0},
  //     {r: 128, g: 0, b: 0},
  //     {r: 0, g: 0, b: 0}    
  //   ], 64, 0*4);

  // private colorMap: ColorMap = new ColorMap(
  //   [
  //     {r: 0, g: 0, b: 0},
  //     {r: 255, g: 0, b: 0},
  //     {r: 255, g: 255, b: 0},
  //     {r: 255, g: 255, b: 255},
  //     {r: 0, g: 255, b: 255},
  //     {r: 0, g: 0, b: 255},
  //     {r: 0, g: 255, b: 0},
  //     {r: 0, g: 0, b: 0}    
  //   ], 32);

  // private colorMap: ColorMap = new ColorMap(
  //   [
  //     {r: 0, g: 0, b: 0},
  //     {r: 255, g: 0, b: 0},
  //     {r: 255, g: 255, b: 0},
  //     {r: 255, g: 255, b: 255},
  //     {r: 255, g: 255, b: 0},
  //     {r: 255, g: 0, b: 0},
  //     {r: 0, g: 0, b: 0}    
  //   ], 128);

  @ViewChild('canvasArea') private canvasArea;

  private static isInMbMaybe(z: Complex, iterations: number, colorMap: ColorMap): Color {

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
        return colorMap.getColor(i);
      } else {
        z0r = z1r;
        z0i = z1i;
      }
    }
    return { r: 0, g: 0, b: 0 };
  }

  public onMouseWheelChrome(event: any) {
    const zoomIn = (event.deltaY < 0);
    const factor = zoomIn ? ZOOM_PERCENTAGE : 1 / ZOOM_PERCENTAGE;
    const newZoomLevel = zoomIn ? this.config.zoomLevel+1 : this.config.zoomLevel-1;
    this.panZoom({ x: event.offsetX, y: event.offsetY }, factor, newZoomLevel);
  }

  public onPointerup(event: PointerEvent) {
    // only left button
    if (event.button === 0) {
      this.panZoom({ x: event.offsetX, y: event.offsetY }, 1, this.config.zoomLevel);
    } else if (event.button === 1) {
      window.location.href = '/';
    }
  }

  public onSaveButtonClick() {
    this.canvasArea.nativeElement.toBlob((blob) => {
      const filename = 'MB_zStart_r_' + this.config.zStart.real
        + '_i_' + this.config.zStart.imag
        + '_zEnd_r_' + this.config.zEnd.real
        + '_i_' + this.config.zEnd.imag
        + '_zoomLevel_' + this.config.zoomLevel
        + '.png';

      console.info('Saving as: ' + filename);
      saveAs(blob, filename);
    });
  }

  constructor(private element: ElementRef) {

    // let colors: Color[] = [{r:0, g:0, b:0}];
    // for (let i = 0; i < 20; i++) {
    //   colors.push({
    //     r: Math.round(Math.random()*256),
    //     g: Math.round(Math.random()*256),
    //     b: Math.round(Math.random()*256)
    //   });
    // }
    // colors.push({r:0, g:0, b:0});
    // this.colorMap = new ColorMap(colors, 128);

    let initialConfig: Config;
    try {
      initialConfig = JSON.parse(window.location.hash.substr(1));
    } catch (error) {
      initialConfig = {
        zStart: this.RES.zStart,
        zEnd: this.RES.zEnd,
        zoomLevel: 1
      };
    }
    this.setPlane(initialConfig.zStart, initialConfig.zEnd, initialConfig.zoomLevel);
  }

  ngOnInit() {
    this.canvasArea.nativeElement.width = this.DIM.width;
    this.canvasArea.nativeElement.height = this.DIM.height;
    this.calcAndDraw();
    // for (let i = 0; i < 56; i++) {
    //   const c = mapToColoredValueEvenBetter(i, 0);
    //   console.log(i + ' ' + Math.ceil((i+1)/4) + ' r' + c.r + ' g' + c.g + ' b' + c.b);
    // }
  }

  private calcAndDraw() {
    const ctx = this.canvasArea.nativeElement.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.DIM.width, this.DIM.height);
    const iterations = (this.config.zoomLevel < 2) ? 255 : 255 + this.config.zoomLevel * 32;

    let buf = new ArrayBuffer(imageData.data.length);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);
    let rowCnt = 0;

    console.clear();
    for (let y = 0; y < this.DIM.height; y++) {
      if (rowCnt > 99) {
        console.info('calculating: ' + Math.round(100*y/this.DIM.height) + '%');
        rowCnt = 0;
      }
      rowCnt++;      
      for (let x = 0; x < this.DIM.width; x++) {
        let z = this.pixelToMath({x: x, y: y});
        let value = DrawAreaComponent.isInMbMaybe(z, iterations, this.colorMap);
        data[y * this.DIM.width + x] = 
          (255 << 24) |       // alpha
          (value.b << 16) |     // blue
          (value.g << 8) |      // green
          value.r;              // red
      }
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);  
  }

  private panZoom(center: Coordinate, factor: number, zoomLevel: number) {
    const diffX = factor * this.DIM.width / 2;
    const diffY = factor * this.DIM.height / 2;
    const coord1: Coordinate = {
      x: center.x - diffX,
      y: center.y + diffY
    };
    const coord2: Coordinate = {
      x: center.x + diffX,
      y: center.y - diffY
    };
    this.setPlane(this.pixelToMath(coord1), this.pixelToMath(coord2), zoomLevel);
    this.calcAndDraw();
  }

  private setPlane(zStart: Complex, zEnd: Complex, zoomLevel: number) {
    this.config =  {
      zStart: zStart,
      zEnd: zEnd,
      zoomLevel: zoomLevel
    }
    this.zRange = {
      real: zEnd.real - zStart.real,
      imag: zEnd.imag - zStart.imag
    }
    this.setConfig();
  }

  private setConfig() {
    const newConfig: Config = {
      zStart: this.config.zStart,
      zEnd: this.config.zEnd,
      zoomLevel: this.config.zoomLevel
    }
    window.location.hash = JSON.stringify(newConfig);
  }

  private pixelToMath(coordinate: Coordinate): Complex {
    return {
      real: this.zRange.real * coordinate.x / this.DIM.width + this.config.zStart.real,
      imag: this.config.zEnd.imag - this.zRange.imag * coordinate.y / this.DIM.height
    }
  }
}
