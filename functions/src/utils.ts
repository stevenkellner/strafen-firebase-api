import { DatabaseReference, DatabaseType, UtcDate } from "firebase-function";
import { DatabaseScheme } from "./DatabaseScheme";
import { getPrivateKeys } from "./privateKeys";
import { Guid } from "./types/Guid";

export function removeKey<T extends Record<string, unknown>, Key extends keyof T>(value: T, key: Key): Omit<T, Key> {
    const newValue = {} as Omit<T, Key>;
    for (const entry of Object.entries(value)) {
        if (entry[0] !== key)
            newValue[entry[0] as keyof Omit<T, Key>] = entry[1] as Omit<T, Key>[keyof Omit<T, Key>];
    }
    return newValue;
}

export function baseDatabase(getDatabaseType: DatabaseType | { databaseType: DatabaseType } | { parameters: { databaseType: DatabaseType } }): DatabaseReference<DatabaseScheme> {
    let databaseType: DatabaseType;
    if ('databaseType' in getDatabaseType) {
        databaseType = getDatabaseType.databaseType;
    } else if ('parameters' in getDatabaseType) {
        databaseType = getDatabaseType.parameters.databaseType;
    } else {
        databaseType = getDatabaseType;
    }
    return DatabaseReference.base<DatabaseScheme>(getPrivateKeys(databaseType));
}

export async function valueChanged(id: Guid, clubId: Guid, databaseType: DatabaseType, type: 'persons' | 'reasonTemplates' | 'fines') {
    const reference = baseDatabase(databaseType).child('clubs').child(clubId.guidString).child('changes').child(type).child(id.guidString);
    await reference.set(`${UtcDate.now.encoded}_${Guid.newGuid().guidString.slice(0, 8)}`);
}

export type Deletable<T extends { id: unknown }> = T | { 
    deleted: T['id'];
};