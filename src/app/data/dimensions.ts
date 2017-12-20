import {Complex} from '../components/draw-area/draw-area.component';

export interface Ratio {
    _16x9: Resolution;
    _16x10: Resolution;
    _48x10: Resolution;
}

export interface Resolution {
    zStart: Complex;
    zEnd: Complex;
    xs?: Dimension;
    s?: Dimension;
    m?: Dimension;
    l?: Dimension;
    xl?: Dimension;
    xxl?: Dimension;
    xxxl?: Dimension;
}

export interface Dimension {
    width: number;
    height: number;
}

export const DIMENSIONS: Ratio = {
    _16x9: {
        zStart: { real: -3, imag: -1.35 },
        zEnd: { real: 1.8, imag: 1.35 },
        xs: { width: 800, height: 450 },
        s: { width: 1280, height: 720 },
        m: { width: 1920, height: 1080 },
        l: { width: 4800, height: 2700 },
        xl: { width: 9600, height: 5400 }
    },
    _16x10: {
        zStart: { real: -3, imag: -1.5 },
        zEnd: { real: 1.8, imag: 1.5 },
        xs: { width: 800, height: 500 },
        s: { width: 1280, height: 800 },
        m: { width: 1920, height: 1200 },
        l: { width: 4800, height: 3000 },
        xl: { width: 9600, height: 6000 }
    },
    _48x10: {
        zStart: { real: -10, imag: -1.5 },
        zEnd: { real: 4.4, imag: 1.5 },
        xs: { width: 1920, height: 400 },
        s: { width: 3840, height: 800 },
        m: { width: 5760, height: 1200 },
        l: { width: 11520, height: 2400 },
        xl: { width: 17280, height: 3600 }
    }
}