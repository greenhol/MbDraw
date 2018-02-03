export interface Color {
    r: number;
    g: number;
    b: number;
}

export interface ColorMapConfig {
    colorSteps: string[];
    intervalSize: number;
    offset: number;
}

export class ColorMap {

    private static hexToRgb(hex): Color | null {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    private _config: ColorMapConfig;
    private _colors: Color[] = [];
    private _intervalCount: number;
    private _intervalsEnd: number;

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

    private static pad(num, size) {
        var s = '' + num;
        while (s.length < size) s = '0' + s;
        return s;
    }

    constructor(config: ColorMapConfig) {

        this._config = config;
        this._intervalCount = this._config.colorSteps.length - 1;

        if (this._config.intervalSize < 1) throw new Error('intervalSize invalid (needs to be > 0)');
        if (this._intervalCount < 1) throw new Error('number of color steps invalid (needs to be > 1)');

        this._intervalsEnd = this._intervalCount * this._config.intervalSize;

        for (let i = 0; i < this._config.colorSteps.length-1; i++) {
            const color1: Color = ColorMap.hexToRgb(this._config.colorSteps[i]);
            const color2: Color = ColorMap.hexToRgb(this._config.colorSteps[i+1]);

            if (color1 === null || color2 === null) throw new Error('ColorMap-Config invalid');

            let redValues = ColorMap.evaluateInterval(i*this._config.intervalSize, (i+1)*this._config.intervalSize, color1.r, color2.r);
            let greenValues = ColorMap.evaluateInterval(i*this._config.intervalSize, (i+1)*this._config.intervalSize, color1.g, color2.g);
            let blueValues = ColorMap.evaluateInterval(i*this._config.intervalSize, (i+1)*this._config.intervalSize, color1.b, color2.b);
            
            for (let j = 0; j < redValues.length; j++) {
                this._colors.push({
                    r: Math.round(redValues[j]),
                    g: Math.round(greenValues[j]),
                    b: Math.round(blueValues[j])
                })
            }
        }
    }

    public get config(): ColorMapConfig {
        return this._config;
    }

    public get configAsString(): string {
        let configString = '';
        for (let i = 0; i < this._config.colorSteps.length; i++) {
            configString += 'C' + (i+1) + this._config.colorSteps[i];
        }
        configString += '_intervalSize_' + this._config.intervalSize;
        let digits = ('' + this._colors.length).length;
        configString += '_Offset_' + ColorMap.pad(this._config.offset, digits);
        return configString;
    }

    public getColor(iteration: number): Color {
        if (iteration === Infinity) return { r: 0, g: 0, b: 0 };
        iteration += this._config.offset;
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
            cnt = cnt % this._config.intervalSize;
        });
    }

}
