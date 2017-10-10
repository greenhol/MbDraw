import { Component, ViewEncapsulation, OnInit, ElementRef, HostListener } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';

interface Complex {
  real: number;
  imag: number;
}

interface Coordinate {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const ZOOM_PERCENTAGE = 0.5;
const REAL_RANGE1 = -2;
const REAL_RANGE2 = 1;
const IMAG_RANGE1 = -1;
const IMAG_RANGE2 = 1;
const REAL_RANGE = REAL_RANGE2-REAL_RANGE1;
const IMAG_RANGE = IMAG_RANGE2-IMAG_RANGE1;

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
    return 0;
  }

  @HostListener('mousewheel', ['$event']) onMouseWheelChrome(event: any) {
    const factor = (event.deltaY > 0) ? ZOOM_PERCENTAGE : 1/ZOOM_PERCENTAGE;
    this.panZoom({
      x: event.offsetX,
      y: event.offsetY
    }, factor);
  }

  @HostListener('pointerup', ['$event'])
  public pointerup(event: PointerEvent) {
    this.panZoom({
      x: event.offsetX,
      y: event.offsetY
    }, 1);
  }

  constructor(private element: ElementRef, d3Service: D3Service) {
    this.d3 = d3Service.getD3();
    this.setPlane({
      real: REAL_RANGE1,
      imag: IMAG_RANGE1
    }, {
      real: REAL_RANGE2,
      imag: IMAG_RANGE2
    });
  }

  ngOnInit() {

    this.canvas = this.d3.select(this.element.nativeElement)
      .append('canvas')
      .classed('canvasArea', true)
      .attr('width', CANVAS_WIDTH)
      .attr('height', CANVAS_HEIGHT)
      .node();

    this.redraw();

    // const ctx = this.canvas.getContext('2d');
    // const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // let buf = new ArrayBuffer(imageData.data.length);
    // let buf8 = new Uint8ClampedArray(buf);
    // let data = new Uint32Array(buf);

    // let dataset = this.d3.range(CANVAS_HEIGHT).map((d, i) => this.d3.range(CANVAS_WIDTH).map(() => 255));
    // console.log(dataset);

    // console.log(DrawAreaComponent.isInMbMaybe(DrawAreaComponent.pixelToMath({x: 190, y: 400}), 50));

    // let iterations = 1;

    // setInterval(() => {

      // for (let y = 0; y < CANVAS_HEIGHT; ++y) {
      //   for (let x = 0; x < CANVAS_WIDTH; ++x) {
      //     // let value = dataset[y][x];
      //     // let value = ~~(Math.random()*255);
  
      //     let z = this.pixelToMath({x: x, y: y});
      //     // let value = DrawAreaComponent.isInMbMaybe(z, iterations) ? 0 : 255;
      //     let value = DrawAreaComponent.isInMbMaybe(z, 255);
  
      //     data[y * CANVAS_WIDTH + x] = 
      //       (255 << 24) |       // alpha
      //       (value << 16) |   // blue
      //       (value << 8) |      // green
      //       value;                // red
      //   }
      // }

      // imageData.data.set(buf8);
      // ctx.putImageData(imageData, 0, 0);  

    //   iterations++;
  
    // }, 100);

    // for (let y = 0; y < CANVAS_HEIGHT; ++y) {
    //   for (let x = 0; x < CANVAS_WIDTH; ++x) {
    //     // let value = dataset[y][x];
    //     // let value = ~~(Math.random()*255);

    //     let z = DrawAreaComponent.pixelToMath({x: x, y: y});
    //     let value = DrawAreaComponent.isInMbMaybe(z, 250) ? 0 : 255;

    //     data[y * CANVAS_WIDTH + x] = 
    //       (255 << 24) |       // alpha
    //       (value << 16) |   // blue
    //       (value << 8) |      // green
    //       value;                // red
    //   }
    // }
    
    // imageData.data.set(buf8);
    // ctx.putImageData(imageData, 0, 0);
    
  }

  private redraw() {
    const ctx = this.canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    let buf = new ArrayBuffer(imageData.data.length);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);

    let dataset = this.d3.range(CANVAS_HEIGHT).map((d, i) => this.d3.range(CANVAS_WIDTH).map(() => 255));

    for (let y = 0; y < CANVAS_HEIGHT; ++y) {
      for (let x = 0; x < CANVAS_WIDTH; ++x) {
        let z = this.pixelToMath({x: x, y: y});
        let value = DrawAreaComponent.isInMbMaybe(z, 255);
        data[y * CANVAS_WIDTH + x] = 
          (255 << 24) |       // alpha
          (value << 16) |   // blue
          (value << 8) |      // green
          value;                // red
      }
    }

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
    }
    this.setPlane(this.pixelToMath(coord1), this.pixelToMath(coord2));
    this.redraw();
  }

  private setPlane(zStart: Complex, zEnd: Complex) {
    this.zStart = zStart;
    this.zEnd = zEnd;
    this.zRange = {
      real: zEnd.real - zStart.real,
      imag: zEnd.imag - zStart.imag
    }
  }

  private pixelToMath(coordinate: Coordinate): Complex {
    return {
      real: this.zRange.real * coordinate.x / CANVAS_WIDTH + this.zStart.real,
      imag: this.zEnd.imag - this.zRange.imag * coordinate.y / CANVAS_HEIGHT
    }
  }

}
