type Subscriber<T> = (value: T) => void;

export class Subject<T> {
  private subscribers: Subscriber<T>[] = [];
  private currentValue: T;

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  subscribe(callback: Subscriber<T>) {
    this.subscribers.push(callback);
    callback(this.currentValue);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  next(value: T) {
    this.currentValue = value;
    this.subscribers.forEach(callback => callback(value));
  }

  getValue(): T {
    return this.currentValue;
  }
}