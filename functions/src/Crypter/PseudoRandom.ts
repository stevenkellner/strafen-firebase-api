/* eslint-disable require-jsdoc */
/**
 * Generates random numbers in [0.0, 1.0) depending on a specified seed.
 */
export class PseudoRandom {

    /**
     * Initial mash
     */
    private readonly INITIAL_MASH_N = 0xefc8249d;

    /**
     * State of the generator
     */
    private readonly state: PseudoRandom.State;

    /**
     * Initializes PseudoRandom with a seed
     * @param { string } seed Seed of the pseudo random number generator
     */
    public constructor(seed: string) {
        let n = this.INITIAL_MASH_N;
        n = PseudoRandom.mash(n, ' ');
        let state0 = PseudoRandom.mashResult(n);
        n = PseudoRandom.mash(n, ' ');
        let state1 = PseudoRandom.mashResult(n);
        n = PseudoRandom.mash(n, ' ');
        let state2 = PseudoRandom.mashResult(n);
        n = PseudoRandom.mash(n, seed);
        state0 -= PseudoRandom.mashResult(n);
        if (state0 < 0) {
            state0 += 1;
        }
        n = PseudoRandom.mash(n, seed);
        state1 -= PseudoRandom.mashResult(n);
        if (state1 < 0) {
            state1 += 1;
        }
        n = PseudoRandom.mash(n, seed);
        state2 -= PseudoRandom.mashResult(n);
        if (state2 < 0) {
            state2 += 1;
        }
        this.state = {
            state0: state0,
            state1: state1,
            state2: state2,
            constant: 1,
        };
    }

    /**
     * Mashes number `m` and data to a number
     * @param { number } m Number `m`
     * @param { string } data Data to mash
     * @return { number } Mashed number
     */
    static mash(m: number, data: string): number {
        let n = m;
        for (let i = 0; i < data.length; i++) {
            n += data.codePointAt(i) ?? 0;
            let h = 0.02519603282416938 * n;
            n = Math.floor(h);
            h -= n;
            h *= n;
            n = Math.floor(h);
            h -= n;
            n += h * 0x100000000;
        }
        return n;
    }

    /**
     * Mashes number `n`
     * @param { number } n Number `n`
     * @return { number } Mashed number
     */
    static mashResult(n: number): number {
        return Math.floor(n) * 2.3283064365386963e-10;
    }

    /**
     * Generates next pseudo random number between [0.0, 1.0).
     * @return { number } Random number between [0.0, 1.0)
     */
    public random(): number {
        const t = 2091639 * this.state.state0 + this.state.constant * 2.3283064365386963e-10;
        this.state.state0 = this.state.state1;
        this.state.state1 = this.state.state2;
        this.state.constant = Math.trunc(t);
        this.state.state2 = t - this.state.constant;
        return this.state.state2;
    }
}

export namespace PseudoRandom {

    /**
     * States of the generator
     */
    export interface State {

        /**
         * State 0
         */
        state0: number,

        /**
         * State 1
         */
        state1: number,

        /**
         * State 2
         */
        state2: number,

        /**
         * Constant state
         */
        constant: number,
    }
}
