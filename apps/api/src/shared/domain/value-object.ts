export abstract class ValueObject<T> {
  protected abstract toValue(): T;

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return JSON.stringify(this.toValue()) === JSON.stringify(other.toValue());
  }
}
