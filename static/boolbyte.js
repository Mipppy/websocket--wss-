export class $BOOLBYTE {
    uint = new Uint8Array(new ArrayBuffer(1))
    set(index, bool) {
        if (bool) {
            this.uint[0] |= (1 << index);
        } else {
            this.uint[0] &= ~(1 << index);
        }
    }
    get(index) {
        return (this.uint[0] & (1 << index)) !== 0;
    }

    toggleToMatch(otherBoolByte) {
        for (let i = 0; i < 8; i++) { 
            try {
                const thisBit = this.get(i);
                const otherBit = otherBoolByte.get(i);
                if (thisBit !== otherBit) {
                    this.set(i, !thisBit);
                }
            } catch (e) {}
        }
    }
    constructor() {
        for (var i = 0; i < 7; i++) {
            this.uint[0] |= (0 << i)
        }
    }

}

