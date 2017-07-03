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
	private isComplete = false;
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
		if (this.isComplete) {
			return;
		}
		this.values.push(value);
		for (const subscriber of this.subscribers) {
			subscriber.onvalue(value);
		}
	}

	private handleError(error: Error) {
		if (this.isComplete) {
			return;
		}
		this.isComplete = true;
		this.error = error;
		for (const subscriber of this.subscribers) {
			subscriber.onerror(error);
		}
		this.subscribers = [];
	}

	private handleComplete() {
		if (this.isComplete) {
			return;
		}
		this.isComplete = true;
		for (const subscriber of this.subscribers) {
			subscriber.oncomplete();
		}
		this.subscribers = [];
	}

	public when<T>(onvalue: (value: V) => T, onerror: (error: Error) => void, oncomplete: () => void): Whenable<T> {
		const whenable = new Whenable<T>();
		const subscriber: Subscriber<V> = {
			onvalue: (value: V) => {
				whenable.handleValue(onvalue(value));
			},
			onerror: (error: Error) => {
				// TODO: allow aborting error?
				onerror(error);
				whenable.handleError(error);
			},
			oncomplete: () => {
				oncomplete();
				whenable.handleComplete();
			},
		};
		if (this.isComplete) {
			for (const value of this.values) {
				subscriber.onvalue(value);
			}
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
