export const mod = (n, m) => {
	return ((n % m) + m) % m;
}

export const clamp = (number, min, max) => Math.min(Math.max(number, min), max);
