import {Complex} from '../components/draw-area/draw-area.component';

export interface Ratios {
    _16x9: Ratio;
    _16x10: Ratio;
    _48x10: Ratio;
}

export interface Ratio {
    factorWidth: number;
    factorHeight: number;
    zStart: Complex;
    zEnd: Complex;
    xs: Resolution;
    s: Resolution;
    m: Resolution;
    l: Resolution;
    xl: Resolution;
}

export interface Resolution {
    width: number;
    height: number;
}

export interface RatioSelector {
    id: string;
    displayName: string;
    ratio: Ratio;
}

export interface ResolutionSelector {
    id: string;
    displayName: string;
}

const ALLRATIOS: Ratios = {
    _16x9: {
        factorWidth: 16,
        factorHeight: 9,
        zStart: { real: -3, imag: -1.35 },
        zEnd: { real: 1.8, imag: 1.35 },
        xs: { width: 800, height: 450 },
        s: { width: 1280, height: 720 },
        m: { width: 1920, height: 1080 },
        l: { width: 3840, height: 2160 },
        xl: { width: 7680, height: 4320 }
    },
    _16x10: {
        factorWidth: 16,
        factorHeight: 10,
        zStart: { real: -3, imag: -1.5 },
        zEnd: { real: 1.8, imag: 1.5 },
        xs: { width: 800, height: 500 },
        s: { width: 1280, height: 800 },
        m: { width: 1920, height: 1200 },
        l: { width: 3840, height: 2400 },
        xl: { width: 7680, height: 4800 },
    },
    _48x10: {
        factorWidth: 48,
        factorHeight: 10,
        zStart: { real: -10, imag: -1.5 },
        zEnd: { real: 4.4, imag: 1.5 },
        xs: { width: 1920, height: 400 },
        s: { width: 3840, height: 800 },
        m: { width: 5760, height: 1200 },
        l: { width: 11520, height: 2400 },
        xl: { width: 17280, height: 3600 },
    }
}

export const RATIOS: RatioSelector[] = [
    {
        id: '16x9',
        displayName: '16 : 9',
        ratio: ALLRATIOS._16x9
    },
    {
        id: '16x10',
        displayName: '16 : 10',
        ratio: ALLRATIOS._16x10
    },
    {
        id: '48x10',
        displayName: '48 : 10',
        ratio: ALLRATIOS._48x10
    }
];

export const RESOLUTIONS: ResolutionSelector[] = [
    {
        id: 'xs',
        displayName: 'XS'
    },
    {
        id: 's',
        displayName: 'S'
    },
    {
        id: 'm',
        displayName: 'M'
    },
    {
        id: 'l',
        displayName: 'L'
    },
    {
        id: 'xl',
        displayName: 'XL'
    }
];
