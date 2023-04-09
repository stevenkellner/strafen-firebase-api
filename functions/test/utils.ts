export function mapValues<T, U>(object: Record<string, T>, transform: (entry: [string, T]) => U): Record<string, U> {
    const newObject: Record<string, U> = {};
    for (const entry of Object.entries(object))
        newObject[entry[0]] = transform(entry);
    return newObject;
}
