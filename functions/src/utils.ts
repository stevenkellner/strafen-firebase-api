export function removeKey<T extends Record<string, unknown>, Key extends keyof T>(value: T, key: Key): Omit<T, Key> {
    const newValue = {} as Omit<T, Key>;
    for (const entry of Object.entries(value)) {
        if (entry[0] !== key)
            newValue[entry[0] as keyof Omit<T, Key>] = entry[1] as Omit<T, Key>[keyof Omit<T, Key>];
    }
    return newValue;
}
