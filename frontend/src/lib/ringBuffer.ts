/**
 * Fixed-capacity ring buffer using Float64Array.
 * Writes are O(1), ordered reads copy to a new array.
 */
export class RingBuffer {
  private buffer: Float64Array;
  private head = 0;
  private _count = 0;

  constructor(private capacity: number) {
    this.buffer = new Float64Array(capacity);
  }

  get count(): number {
    return this._count;
  }

  get isFull(): boolean {
    return this._count >= this.capacity;
  }

  push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this._count < this.capacity) this._count++;
  }

  pushBatch(values: number[] | Float64Array): void {
    for (let i = 0; i < values.length; i++) {
      this.buffer[this.head] = values[i];
      this.head = (this.head + 1) % this.capacity;
    }
    this._count = Math.min(this._count + values.length, this.capacity);
  }

  /** Return data ordered oldest-to-newest. */
  getOrdered(): Float64Array {
    const result = new Float64Array(this._count);
    if (this._count < this.capacity) {
      // Buffer not yet full — data starts at 0
      result.set(this.buffer.subarray(0, this._count));
    } else {
      // Buffer full — wrap around head
      const tail = this.head; // oldest element
      const firstLen = this.capacity - tail;
      result.set(this.buffer.subarray(tail, tail + firstLen), 0);
      result.set(this.buffer.subarray(0, tail), firstLen);
    }
    return result;
  }

  clear(): void {
    this.head = 0;
    this._count = 0;
    this.buffer.fill(0);
  }
}
