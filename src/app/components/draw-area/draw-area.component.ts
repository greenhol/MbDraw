import { Component, ViewEncapsulation, OnInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { timer } from 'rxjs';
import { saveAs } from 'file-saver';
import { RATIOS, Ratio, Resolution, RatioSelector, ResolutionSelector, RESOLUTIONS } from '../../data/dimensions';
import { ColorMap, Color, ColorMapConfig } from '../../data/color-map';
import { TouchEnum, TouchData } from '../../directives/touch-me.directive';

export interface Complex {
  real: number;
  imag: number;
}

interface Config {
  ratioId: string;
  resolutionId: string;
  zStart: Complex;
  zEnd: Complex;
  iterations: number;
  colorMapConfig: ColorMapConfig;
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

  public ratios = RATIOS;
  public ratio: RatioSelector;
  public resolutions = RESOLUTIONS
  public resolution: ResolutionSelector;
  public busy = true;

  private config: Config;
  private zRange: Complex;
  private data: number[];
  private colorMap: ColorMap;
  private colorMapConfigDefault: ColorMapConfig = {
    colorSteps: ['#000000','#FFFFFF','#000000'],
    intervalSize: 256,
    offset: 0
  };

  private colorMapConfigSample1: ColorMapConfig = {
    colorSteps: ['#000000', '#800000', '#FF4000', '#FF8000', 'FF4000', '#800000', '#000000'],
    intervalSize: 64,
    offset: 0
  };
  private colorMapConfigSample2: ColorMapConfig = {
    colorSteps: ['#000000', '#FF0000', '#FFFF00', '#FFFFFF', '00FFFF', '#0000FF', '#00FF00', '#000000'],
    intervalSize: 32,
    offset: 0
  };
  private colorMapConfigSample3: ColorMapConfig = {
    colorSteps: ['#000000', '#FF0000', '#FFFF00', '#FFFFFF', 'FFFF00', '#FF0000', '#000000'],
    intervalSize: 128,
    offset: 0
  };

  @ViewChild('canvasArea') private canvasArea;

  private static isInMbMaybe(z: Complex, iterations: number): number {

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
        return i;
      } else {
        z0r = z1r;
        z0i = z1i;
      }
    }
    return Infinity;
  }

  private static complexCenter(z1: Complex, z2: Complex): Complex {
    return {
      real: (z1.real + z2.real) / 2,
      imag: (z1.imag + z2.imag) / 2,
    }
  }

  private static complexRange(z1: Complex, z2: Complex): Complex {
    return {
      real: Math.abs(z1.real - z2.real),
      imag: Math.abs(z1.imag - z2.imag)
    }
  }

  private get size(): Resolution {
    return this.ratio.ratio[this.resolution.id];
  }

  constructor(private element: ElementRef) {

    let initialConfig: Config;
    try {
      initialConfig = JSON.parse(decodeURI(window.location.hash.substr(1)));
    } catch (error) {
      console.error(`Could not evaluate location.hash ${window.location.hash.substr(1)}`, error);
      initialConfig = {
        ratioId: '16x9',
        resolutionId: 's',
        zStart: RATIOS[0].ratio.zStart,
        zEnd: RATIOS[0].ratio.zEnd,
        iterations: 255,
        colorMapConfig: this.colorMapConfigDefault
      };
    }
    this.ratio = RATIOS.find((value: RatioSelector): boolean => value.id === initialConfig.ratioId);
    this.resolution = RESOLUTIONS.find((value: ResolutionSelector): boolean => value.id === initialConfig.resolutionId);
    this.colorMap = new ColorMap(initialConfig.colorMapConfig);    
    this.setPlane(initialConfig.zStart, initialConfig.zEnd, initialConfig.iterations);
  }

  ngOnInit() {
    this.canvasArea.nativeElement.width = this.size.width;
    this.canvasArea.nativeElement.height = this.size.height;
    this.calcAndDraw();
  }

  public onMouseWheelChrome(event: any) {
    const zoomIn = (event.deltaY < 0);
    const center: Coordinate = { x: event.offsetX, y: event.offsetY };

    if (zoomIn) this.zoomIn(center);
    else this.zoomOut(center);
  }

  public onTouched(event: TouchData) {
    console.log('event ', event);
    switch (event.type) {
      case TouchEnum.SINGLE_TAP: 
        this.panZoom({ x: event.offsetX, y: event.offsetY }, 1, this.config.iterations);
        break;
      case TouchEnum.DOUBLE_TAP:
        this.zoomIn({x: event.offsetX, y: event.offsetY});
        break;
      case TouchEnum.LONG_TAP:
        this.zoomOut({x: event.offsetX, y: event.offsetY});
        break;
    }
  }

  public onSaveButtonClick() {
    this.canvasArea.nativeElement.toBlob((blob) => {
      const filename = 'MB_zStart_r_' + this.config.zStart.real
        + '_i_' + this.config.zStart.imag
        + '_zEnd_r_' + this.config.zEnd.real
        + '_i_' + this.config.zEnd.imag
        + '_iterations_' + this.config.iterations
        // + '_colorMapConfig_' + this.colorMap.configAsString
        + '.png';

      console.info('Saving as: ' + filename);
      saveAs(blob, filename);
    });
  }

  public onResetButtonClick() {
    window.location.href = window.location.pathname;
  }

  public onRatioChange(newRatio: RatioSelector) {
    console.log('new ratio: ', this.ratio);
    this.config.ratioId = newRatio.id;
    
    const center = DrawAreaComponent.complexCenter(this.config.zStart, this.config.zEnd);
    const range = DrawAreaComponent.complexRange(this.config.zStart, this.config.zEnd);
    const distPerFactor = range.imag / newRatio.ratio.factorHeight;

    this.config.zStart = {
      real: center.real - distPerFactor * newRatio.ratio.factorWidth / 2,
      imag: this.config.zStart.imag
    };
    this.config.zEnd = {
      real: center.real + distPerFactor * newRatio.ratio.factorWidth / 2,
      imag: this.config.zEnd.imag
    };
    
    this.persistConfig();
    window.location.reload();
  }

  public onResolutionChange(newResolution: ResolutionSelector) {
    console.log('new resolution: ', this.resolution);
    this.config.resolutionId = newResolution.id;
    this.persistConfig();
    window.location.reload();
  }

  private async setBusy(value: boolean) {
    return new Promise((resolve) => {
      this.busy = value;
      timer(value ? 100 : 0).subscribe(() => {
        resolve();
      })
    })
  }

  private async calcAndDraw() {
    await this.setBusy(true);
    console.log('bla');
    const ctx = this.canvasArea.nativeElement.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.size.width, this.size.height);

    let buf = new ArrayBuffer(imageData.data.length);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);
    let rowCnt = 0;

    console.clear();
    for (let y = 0; y < this.size.height; y++) {
      if (rowCnt > 99) {
        console.info('calculating: ' + Math.round(100 * y / this.size.height) + '%');
        rowCnt = 0;
      }
      rowCnt++;
      for (let x = 0; x < this.size.width; x++) {
        let z = this.pixelToMath({x: x, y: y});
        let color = this.colorMap.getColor(DrawAreaComponent.isInMbMaybe(z, this.config.iterations));
        data[y * this.size.width + x] = 
          (255 << 24) |       // alpha
          (color.b << 16) |     // blue
          (color.g << 8) |      // green
          color.r;              // red
      }
    }

    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
    await this.setBusy(false);

    // Experimental for Color Shifting
    // setTimeout(() => {
    //   this.onSaveButtonClick();
    // }, 500);
    // setTimeout(() => {
    //   if (this.config.colorMapConfig.offset < ((this.colorMap.config.colorSteps.length - 1) * this.colorMap.config.intervalSize - 1)) {
    //     this.config.colorMapConfig.offset+=64;
    //     this.persistConfig();
    //     window.location.reload();        
    //   }
    // }, 2000);  
  }

  // // Experimental separationg calculation and drawing (memory issue)
  // private calcAndDraw() {
  //   this.data = this.calc();
  //   console.log('CALC DONE')
  //   setTimeout(() => {
  //     console.log('SETTIMEOUT OVER');
  //     setInterval(() => {
  //       if (this.config.colorMapConfig.offset < ((this.colorMap.config.colorSteps.length-1) * this.colorMap.config.intervalSize - 1)) {
  //         console.log('DRAWING');
  //         this.draw(this.data);
  //         console.log('DRAWING OVER');
  //         setTimeout(() => {
  //           console.log('onSaveButtonClick');
  //           this.onSaveButtonClick();
  //           this.config.colorMapConfig.offset++;
  //           this.colorMap = new ColorMap(this.config.colorMapConfig);
  //         }, 1000);
  //       }
  //     }, 10000);
  //   }, 5000);
  // }

  // private calc(): number[] {
  //   let data: number[] = [];
  //   let rowCnt = 0;
  //   console.clear();
  //   for (let y = 0; y < this.size.height; y++) {
  //     if (rowCnt > 99) {
  //       console.info('calculating: ' + Math.round(100 * y / this.size.height) + '%');
  //       rowCnt = 0;
  //     }
  //     rowCnt++;
  //     for (let x = 0; x < this.size.width; x++) {
  //       let z = this.pixelToMath({x: x, y: y});
  //       data.push(DrawAreaComponent.isInMbMaybe(z, this.config.iterations));
  //     }
  //   }
  //   return data;
  // }

  // private draw(data: number[]) {
  //   const ctx = this.canvasArea.nativeElement.getContext('2d');
  //   const imageData = ctx.getImageData(0, 0, this.size.width, this.size.height);
  //   let buf = new ArrayBuffer(imageData.data.length);
  //   let buf8 = new Uint8ClampedArray(buf);
  //   let drawData = new Uint32Array(buf);
  //   let i = 0;
  //   let rowCnt = 0;
  //   for (let y = 0; y < this.size.height; y++) {
  //     if (rowCnt > 99) {
  //       console.info('drawing: ' + Math.round(100 * y / this.size.height) + '%');
  //       rowCnt = 0;
  //     }
  //     rowCnt++;
  //     for (let x = 0; x < this.size.width; x++) {
  //       let index = y * this.size.width + x;
  //       const color: Color = this.colorMap.getColor(data[index]);
  //       drawData[index] = 
  //         (255 << 24) |       // alpha
  //         (color.b << 16) |     // blue
  //         (color.g << 8) |      // green
  //         color.r;              // red
  //     }
  //   }
  //   imageData.data.set(buf8);
  //   ctx.putImageData(imageData, 0, 0);  
  // }

  private zoomIn(center: Coordinate) {
    this.panZoom(center, ZOOM_PERCENTAGE, this.config.iterations += 32);
  }

  private zoomOut(center: Coordinate) {
    this.panZoom(center, 1 / ZOOM_PERCENTAGE, (this.config.iterations - 32 < 255) ? this.config.iterations -= 0 : this.config.iterations -= 32);
  }

  private panZoom(center: Coordinate, factor: number, zoomLevel: number) {
    const diffX = factor * this.size.width / 2;
    const diffY = factor * this.size.height / 2;
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

  private setPlane(zStart: Complex, zEnd: Complex, iterations: number) {
    this.config =  {
      ratioId: this.ratio.id,
      resolutionId: this.resolution.id,
      zStart: zStart,
      zEnd: zEnd,
      iterations: iterations,
      colorMapConfig: this.colorMap.config
    }
    this.zRange = {
      real: zEnd.real - zStart.real,
      imag: zEnd.imag - zStart.imag
    }
    this.persistConfig();
  }

  private persistConfig() {
    const newConfig: Config = {
      ratioId: this.ratio.id,
      resolutionId: this.resolution.id,
      zStart: this.config.zStart,
      zEnd: this.config.zEnd,
      iterations: this.config.iterations,
      colorMapConfig: this.colorMap.config
    }
    window.location.hash = encodeURI(JSON.stringify(newConfig));
  }

  private pixelToMath(coordinate: Coordinate): Complex {
    return {
      real: this.zRange.real * coordinate.x / this.size.width + this.config.zStart.real,
      imag: this.config.zEnd.imag - this.zRange.imag * coordinate.y / this.size.height
    }
  }
}
