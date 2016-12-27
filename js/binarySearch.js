class BinarySearch {
	static find(array, key, member) {
		let min = 0;
		let max = array.length - 1;
		let mid = -1;
		let element = null;
		while (min <= max) {
			mid = (min + max) / 2 | 0;
			element = array[mid];
			if (element[member] < key) {
				min = mid + 1;
			} else if (element[member] > key) {
				max = mid - 1;
			} else {
				return mid;
			}
		}
		return -1;
	}
}