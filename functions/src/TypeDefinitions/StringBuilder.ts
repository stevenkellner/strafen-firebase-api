export class StringBuilder {

    private stringArray: Array<string> = new Array<string>();

    constructor(initialString: string | null = null) {
        if (initialString !== null)
            this.stringArray.push(initialString);
    }

    isEmpty(): boolean {
        return this.stringArray.length == 0;
    }

    append(string: string) {
        this.stringArray.push(string);
    }

    appendLine(string: string) {
        this.stringArray.push(`${string}\n`);
    }

    toString(): string {
        return this.stringArray.join("");
    }

    clear() {
        this.stringArray = new Array<string>();
    }
}
