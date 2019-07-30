declare var window: { __preloadedData: { [key: string]: any } };

export function GetPreloadedData(preloadKey: string) {
	return preloadKey.split('.').reduce((value, part) => {
		// value must be indexable
		if (value === null || typeof value !== 'object') return null;
		return value[part];
	}, window.__preloadedData);
}

//export function isPersona(targetPersona: Personas) {
//	return ((GetPreloadedData('Persona') as number) & targetPersona) > 0; // tslint:disable-line no-bitwise
//}

import moment from 'moment';

export interface IPhoneNumberParts {
	countryCode?: string;
	number: string;
}

export function location() {
	const loc = {
		href: window.location.href,
		hash: window.location.hash,
		setHref: (href: string) => window.location.href = href,
		relativePath: window.location.pathname,
		queryString: window.location.search,
		origin: window.location.origin
	};
	return loc as Readonly<typeof loc>;
}

/** location.reload can't be spied */
export function reloadPage() {
	window.location.reload();
}

export function changeUrlAndCurrentHistoryEntry(modifiedUrl: string) {
	window.history.replaceState(undefined, undefined, modifiedUrl);
}

export function updateQueryAndCurrentHistoryEntry(queryString: string) {
	const url = `${window.location.pathname}?${queryString}${window.location.hash}`;
	changeUrlAndCurrentHistoryEntry(url);
}

export function precisionRound(value: number, precision: number) {
	const shift = (num: number, prec: number, reverseShift: boolean) => {
		if (reverseShift)
			prec = -prec;
		const numArray = `${num}`.split('e');

		// tslint:disable prefer-template
		// tslint:disable restrict-plus-operands
		return +(numArray[0] + 'e' + (numArray[1] ? (+numArray[1] + prec) : prec));
		// tslint:enable prefer-template
		// tslint:enable restrict-plus-operands
	};
	return shift(Math.round(shift(value, precision, false)), precision, true);
}

export function formatCurrency(rawCurrency?: number, includeDollarSign: boolean = true, decimalPlaces: number = 2): string {
	if (!rawCurrency && rawCurrency !== 0)
		return '';

	const formattedCurrency = rawCurrency.toFixed(decimalPlaces).replace(/./g, function (c, i, a) {
		const wholePart = a.indexOf('.') === -1 ? a : a.substring(0, a.indexOf('.'));
		return i && c !== '.' && ((wholePart.length - i) % 3 === 0) && (i < wholePart.length) ? `,${c}` : c;
	});

	return includeDollarSign ? `$${formattedCurrency}` : formattedCurrency;
}

export function formatDate(date: string): string {
	return moment(date).format('MM-DD-YYYY, h:mm a');
}

export function calculateMargin(cost: number, sell: number): string {
	return formatMargin(calculateMarginAsNumber(cost, sell));
}

export function formatMargin(margin: number) {
	if (margin === undefined) return 'N/A';
	return `${(margin * 100).toFixed(2)}%`;
}

export function calculateMarginAsNumber(cost: number, sell: number): number {
	if (!sell || !cost) return undefined;
	return (sell - cost) / sell;
}

export function computeSell(cost: number, margin: number): number {
	/*
	margin						= (sell - cost) / sell
	sell * margin				= sell - cost
	sell * margin - sell		= -cost
	sell * (margin - 1)			= -cost
	sell						= -cost / (margin - 1)
	sell						= -1 * cost / -1 * (-margin + 1)
	sell						= -1/-1 * cost / (-margin + 1)
	sell						= cost / (1 - margin)
	*/

	//Prevent divide by 0
	//The only way to have a margin of 1 (100%) is if cost is 0
	//which makes sell any value so just leave it at cost for simplicity
	if (margin === 1)
		return cost;

	return precisionRound(cost / (1 - margin), 2);
}

export function parsePhoneNumber(rawPhoneNumber: string): IPhoneNumberParts {
	if (!rawPhoneNumber)
		return null;

	/**
	 * This is a comprehensive regex that covers:
	 * - an optional international code (only '1' supported), with an optional leading '+' followed by optional whitespace
	 * - a required 3-digit area code, optionally surrounded with parentheses
	 * - a required phone number with one 3-digit segment and one 4-digit segment.
	 * - any of the above can be separated by whitespace, '-', or '.', or nothing
	 * The following will match this regex:
	 * - +  1. ( 919  ) - 408 . 4822
	 * - 19194084822
	 * - 9194084822
	 * - (919)4084822
	 * - (919) 408-4822
	 */
	const phoneNumberRegex = /^((\+\s*)?1\s*[\-\.]?\s*)?\(?\s*(\d{3})\s*\)?\s*[\-\.]?\s*(\d{3})\s*[\-\.]?\s*(\d{4})$/;
	const result = phoneNumberRegex.exec(rawPhoneNumber.trim());

	if (!result)
		return null;

	return {
		countryCode: result[1] ? '1' : null,
		number: `${result[3]}${result[4]}${result[5]}`
	};
}

export function formatPhoneNumber(rawPhoneNumber?: string): string {
	const digitsAsNumber = extractDigits(rawPhoneNumber);

	if (!digitsAsNumber)
		return '';

	const digits = digitsAsNumber.toString();
	if (digits.length <= 3)
		return digits;
	if (digits.length <= 6)
		return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
	if (digits.length <= 10)
		return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
	return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
}

export function formatPhoneNumberAsInternational(rawPhoneNumber?: string): string {
	const parsed = parsePhoneNumber(rawPhoneNumber);
	if (!parsed)
		return rawPhoneNumber;

	const numStr = parsed.number.toString();
	if (numStr.length !== 10)
		return rawPhoneNumber;

	return `+${parsed.countryCode || '1'}-${numStr.substring(0, 3)}-${numStr.substring(3, 6)}-${numStr.substring(6)}`;
}

export function formatZipCode(rawZipCode?: string): string {
	const digitsAsNumber = extractDigits(rawZipCode);

	if (!digitsAsNumber)
		return '';

	const digits = digitsAsNumber.toString();
	if (digits.length <= 5)
		return digits;

	return `${digits.substring(0, 5)}-${digits.substring(5)}`;
}

export function toStringOrEmpty(value: any, decimalPlaces: number = null) {
	if (value === null || value === undefined)
		return '';

	if (decimalPlaces && typeof (value) === 'number')
		return value.toFixed(decimalPlaces);

	return value.toString();
}

/*
 * Take in a string with any characters, pull out only the digits and reconstitute a number
 * Useful for things such as phone number inputs.
 */
export function extractDigits(value: string): number {
	if (!value)
		return null;

	const digits = value.toString().match(/\d/g);
	if (digits && digits.length > 0)
		return parseInt(digits.join(''), 10);
	return null;
}

/*
 * Take in a string and determine if that value is a number or not returning either the number or null.
 * This will work only if the value is strictly parseable as a number.
 */
export function getNumber(value: string): number {
	if (!value)
		return null;

	const result = +value;
	if (isNaN(result))
		return null;

	return result;
}

export function hasValue(value: string): boolean {
	return !!value;
}

/**
 * Async wrapper for window.setTimeout()
 */
export async function sleep(ms: number) {
	return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

export function debounce(action: () => void, waitTime = 50) {
	let timeoutHandle: number;

	return () => {
		window.clearTimeout(timeoutHandle);
		timeoutHandle = window.setTimeout(() => action(), waitTime);
	};
}

export function deepClone<T>(source: T) {
	return JSON.parse(JSON.stringify(source)) as T;
}

/**
 * Performs a deep comparison of any two values.
 * The type parameter provides a typescript guard, but the algorithm assumes they are both any value.
 */
export function deepEqual<T>(a: T, b: T): boolean {
	// equivalent primitive or same object
	if (a === b) return true;
	// primitives, null, and undefined would have returned true above if they were equal
	if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

	// they both must be an array or not an array
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	// check array equality (we only need to check one of them, but we need typescript to narrow the type)
	if (Array.isArray(a) && Array.isArray(b)) {
		// arrays must be of the same length
		if (a.length !== b.length) return false;
		// items in arrays must all be deep equal
		return a.every((_, i) => deepEqual(a[i], b[i]));
	}

	// special logic for sets
	// This logic will unfortunately be incomplete because a true deep comparison would be very slow.
	// JS Sets are based off of === logic, so checking for the existence of an object will only return
	// true for the same reference.
	// Because of this, you shouldn't even be using sets for objects to begin with.
	// A true deep comparison would be possible by iterating over every possible pair
	// from both sets, but that would be O(n^2) and wouldn't provide much value for the cost.
	// This logic will work just fine for any primitives, or for the same references of objects.
	if (a instanceof Set && b instanceof Set) {
		if (a.size !== b.size) return false;
		for (const v of a) {
			if (!b.has(v)) return false;
		}
		return true;
	}

	// both are objects, compare properties
	const aKeys = Object.keys(a).sort() as Array<keyof T>,
		bKeys = Object.keys(b).sort() as Array<keyof T>;
	// keys of both must be exactly equivalent
	if (aKeys.length !== bKeys.length) return false;
	if (!aKeys.every((k, i) => k === bKeys[i])) return false;
	// values of both must be deep equal
	return aKeys.every(k => deepEqual(a[k], b[k]));
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
	// 'any' required because of https://github.com/Microsoft/TypeScript/issues/10727
	return keys.reduce<Pick<T, K>>((picked, key) => ({ ...(picked as any), [key]: obj[key] }), {} as Pick<T, K>);
}

/**
 * Downloads a file with the specified url and name.
 * This logic is separated so that it can be mocked for tests.
 */
export function performFileDownload(filename: string, blob: Blob) {
	if (window.navigator && window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(blob, filename);
	} else {
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.style.display = 'none';

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}

/**
 * Returns a union of the two provided sets
 */
export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
	const result = new Set();

	a.forEach(value => {
		result.add(value);
	});

	b.forEach(value => {
		result.add(value);
	});

	return result;
}

/**
 * Returns the intersection of the two provided sets
 */
export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
	const result = new Set();

	a.forEach(value => {
		if (b.has(value)) {
			result.add(value);
		}
	});

	return result;
}

/**
 * Returns the difference of the two provided sets
 */
export function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
	const result = new Set();

	a.forEach(value => {
		if (!b.has(value)) {
			result.add(value);
		}
	});

	return result;
}

/**
 * Convert a number to its ordering, e.g.:
 * 
 * 1 => '1st'
 * 33 => '33rd'
 * 112 => '112th'
 */
export function getOrdinalNumber(num: number) {
	if (num === 0)
		return '';

	// every 11, 12, and 13 break the rules
	if (num % 100 >= 11 && num % 100 <= 13) return `${num}th`;
	switch (num % 10) {
		case 1: return `${num}st`;
		case 2: return `${num}nd`;
		case 3: return `${num}rd`;
		default: return `${num}th`;
	}
}

/**
 * Using the provided list, return a new list containing no duplicate items
 * according to the specified comparator.
 * 
 * If no comparator is provided, items will be compared using `===`.
 * 
 * Items are returned in the same order as originally provided,
 * with the first duplicate found taking precedence.
 */
export function removeDuplicates<T>(list: T[], comparator?: (a: T, b: T) => boolean) {
	// if there is no explicit comparator provided, just use set logic to dedupe
	if (!comparator) return [...new Set(list)];

	const deduped: T[] = [];
	for (const item of list) {
		if (!deduped.some(_ => comparator(_, item))) deduped.push(item);
	}
	return deduped;
}

/**
 * Wrapper around `navigator.geolocation.getCurrentPosition` to add
 * support for async await syntax.
 * 
 * Returns null if browser does not support obtaining location.
 */
export async function getCurrentLocation(): Promise<Position> {
	if (navigator && navigator.geolocation) {
		try {
			const position = await new Promise<Position>((resolve) => {
				navigator.geolocation.getCurrentPosition(
					pos => resolve(pos),
					() => resolve(null),
					{
						timeout: 20000
					}
				);
			});
			return position;
		} catch {
			return null;
		}
	} else {
		return null;
	}
}
