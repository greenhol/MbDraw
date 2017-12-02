export interface Color {
    r: number;
    g: number;
    b: number;
}

export class ColorMap {

    private _colors: Color[] = [];
    private _intervalSize: number;
    private _intervalCount: number;
    private _intervalsEnd: number;
    private _shift: number;

    private static evaluateInterval(x1: number, x2: number, y1: number, y2: number): number[] {
        if (y1 == y2) {
            return Array.apply(null, {length: (x2-x1)}).map(() => y1);
        }
        let retval: number[] = [];
        for (let i=x1; i<x2; i++) {
            // https://www.wolframalpha.com/input/?i=plot+((2-1)%2F2)*(-cos(((x-1.5)%2F((4.5-1.5)%2F2))*pi%2F2))+%2B+(1+%2B+(2-1)%2F2),+x+%3D+0..5
            // https://www.wolframalpha.com/input/?i=simplify+(y_2-y_1)%2F2*(-cos((x-x_1)%2F(x_2-x_1)*pi))%2B(y_1%2B(y_2-y_1)%2F2)
            retval.push(0.5*((y1-y2)*Math.cos((Math.PI*(i-x1))/(x1-x2))+y1+y2));
        }
        return retval;
    }

    constructor(colors: Color[], intervalSize: number, shift?: number) {
        
        this._intervalSize = Math.round(intervalSize);
        this._intervalCount = colors.length - 1;
        this._shift = shift ? shift : 0;

        if (this._intervalSize < 1 || this._intervalCount < 1) {
            throw new Error('intervalSize invalid');
        }

        this._intervalsEnd = this._intervalCount * this._intervalSize;

        for (let i = 0; i < colors.length-1; i++) {
            const color1 = colors[i];
            const color2 = colors[i+1];

            let redValues = ColorMap.evaluateInterval(i*this._intervalSize, (i+1)*this._intervalSize, color1.r, color2.r);
            let greenValues = ColorMap.evaluateInterval(i*this._intervalSize, (i+1)*this._intervalSize, color1.g, color2.g);
            let blueValues = ColorMap.evaluateInterval(i*this._intervalSize, (i+1)*this._intervalSize, color1.b, color2.b);
            
            for (let j = 0; j < redValues.length; j++) {
                this._colors.push({
                    r: Math.round(redValues[j]),
                    g: Math.round(greenValues[j]),
                    b: Math.round(blueValues[j])
                })
            }
        }
    }

    public getColor(iteration: number): Color {
        iteration += this._shift;
        let index = iteration % this._intervalsEnd;
        return this._colors[index];
    }

    public print(): void {
        let cnt = 0;
        let intervalNo = 0;
        this._colors.forEach((color: Color) => {
            if (cnt == 0) console.log('INTERVAL ' + (intervalNo++));
            console.log(color);
            cnt++;
            cnt = cnt % this._intervalSize;
        });
    }

}