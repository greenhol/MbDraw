export interface Color {
    r: number;
    g: number;
    b: number;
}

export type ColorFct = (value: number, iterations: number) => Color;

export function mapToSqrtColorValue(value: number, iterations: number): Color {
    let grayValue = Math.sqrt(iterations*value)*256/iterations;
    return {
        r: grayValue,
        g: grayValue,
        b: grayValue
    };
}

export function mapToLinearColorValue(value: number, iterations: number): Color {
    let grayValue = value/iterations*255;
    return {
        r: grayValue,
        g: grayValue,
        b: grayValue
    }
}

export function mapToSmoothValue(value: number, iterations: number): Color {
    let grayValue = Math.round(-Math.cos(value*Math.PI/iterations)*127+127);
    return {
        r: grayValue,
        g: grayValue,
        b: grayValue
    };
// return Math.round(-Math.cos(value*Math.PI/iterations/2)*255+255);
}

export function mapToSmoothPeriodicValue(value: number, iterations: number): Color {
    let grayValue = Math.round(-Math.cos(value*Math.PI/255)*127+127);
    return {
        r: grayValue,
        g: grayValue,
        b: grayValue
    }
}

export function mapToColoredValue(value: number, iterations: number): Color {
    const v = value % 1024;
    let r = 0;
    let g = 0;
    let b = 0;
    
    // R
    if (v >= 0 && v < 512) {
        r = Math.round(-Math.cos(value*Math.PI/255)*127+127);
    }
    // G
    if (v >= 256 && v < 768) {
        g = Math.round(-Math.cos((value-256)*Math.PI/255)*127+127);
    }
    // B
    if (v >= 512 && v < 1024) {
        b = Math.round(-Math.cos((value-512)*Math.PI/255)*127+127);
    }

    return {r: r, g: g, b: b}
}

export function mapToColoredValueEvenBetter(value: number, iterations: number): Color {
    const v = value % 1536;
    let r, g, b: number;
    
    if (v >= 0 && v < 256) {
        r = Math.round(-Math.cos(value*Math.PI/255)*127+127);
        g = 0;
        b = 0;
    }
    if (v >= 256 && v < 512) {
        r = 255;
        g = Math.round(-Math.cos((value-256)*Math.PI/255)*127+127);
        b = 0;
    }
    if (v >= 512 && v < 768) {
        r = 255;
        g = 255;
        b = Math.round(-Math.cos((value-512)*Math.PI/255)*127+127);
    }
    if (v >= 768 && v < 1024) {
        r = Math.round(-Math.cos((value-768)*Math.PI/255)*127+127);
        g = 255;
        g = 255;
    }
    if (v >= 1024 && v < 1280) {
        r = 0;
        g = Math.round(-Math.cos((value-1024)*Math.PI/255)*127+127);
        b = 255;
    }
    if (v >= 1280 && v < 1536) {
        r = 0;
        g = 0;
        b = Math.round(-Math.cos((value-1280)*Math.PI/255)*127+127);
    }
    
    return {r: r, g: g, b: b}
}
