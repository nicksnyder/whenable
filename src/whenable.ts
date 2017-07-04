/**
 * whenable.js
 * https://github.com/nicksnyder/whenable
 */


interface Subscriber<V> {
	onvalue(value: V): void;
	oncomplete(): void;
	onerror(error: Error): void;
}

export class Whenable<V> {
	private subscribers: Subscriber<V>[] = [];
	private complete = false;
	private error: Error | undefined;
	private values: V[] = [];

	constructor(
		publisher?: (value: (value: V) => void, error: (error: Error) => void, complete: () => void) => void
	) {
		if (publisher) {
			try {
				publisher(value => {
					this.handleValue(value);
				}, error => {
					this.handleError(error);
				}, () => {
					this.handleComplete();
				});
			} catch (error) {
				this.handleError(error);
			}
		}
	}

	private handleValue(value: V): void {
		this.handle(subscriber => subscriber.onvalue(value), false);
	}

	private handleError(error: Error) {
		this.handle(subscriber => subscriber.onerror(error), true, error);
	}

	private handleComplete() {
		this.handle(subscriber => subscriber.oncomplete(), true);
	}

	private handle(handler: (subscriber: Subscriber<V>) => void, complete: boolean, error?: Error): void {
		if (this.complete) {
			return;
		}
		this.complete = complete;
		this.error = error
		for (const subscriber of this.subscribers) {
			handler(subscriber);
		}
		if (complete) {
			this.subscribers = [];
		}
	}

	public when<T>(onvalue: (value: V) => T, onerror?: (error: Error) => void, oncomplete?: () => void): Whenable<T> {
		const whenable = new Whenable<T>();
		const subscriber: Subscriber<V> = {
			onvalue: (value: V) => {
				whenable.handleValue(onvalue(value));
			},
			onerror: (error: Error) => {
				// TODO: allow aborting error?
				if (onerror) {
					onerror(error);
				}
				whenable.handleError(error);
			},
			oncomplete: () => {
				if (oncomplete) {
					oncomplete();
				}
				whenable.handleComplete();
			},
		};
		// TODO: async?
		for (const value of this.values) {
			subscriber.onvalue(value);
		}
		if (this.complete) {
			if (this.error) {
				subscriber.onerror(this.error);
			} else {
				subscriber.oncomplete();
			}
		} else {
			this.subscribers.push(subscriber);
		}
		return whenable;
	}
}
