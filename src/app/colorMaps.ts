export type ColorFct = (value: number, iterations: number) => number;

export function mapToSqrtColorValue(value: number, iterations: number): number {
    return Math.sqrt(iterations*value)*256/iterations;
}

export function mapToLinearColorValue(value: number, iterations: number): number {
    return value/iterations*255;
}

export function mapToSmoothValue(value: number, iterations: number): number {
    return Math.round(-Math.cos(value*Math.PI/iterations)*127+127);
// return Math.round(-Math.cos(value*Math.PI/iterations/2)*255+255);
}

export function mapToSmoothPeriodicValue(value: number, iterations: number): number {
    return Math.round(-Math.cos(value*Math.PI/255)*127+127);
}