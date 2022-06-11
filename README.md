# Strafen Project Backend

Backend of the strafen project, build with firebase functions.

## Table of Contents
- [Strafen Project Backend](#strafen-project-backend)
    - [Table of Contents](#table-of-contents)
    - [Type Definitions](#type-definitions)
    - [Firebase Functions](#firebase-functions)


## Type Definitions

Types used for parameter or return type:

<details>
    <summary>Click to expand!</summary>

### Amount
```typescript
interface Amount {
    value: number,
    subUnitValue: number
}

Amount.fromNumber(12.50); // 12.50 (€ / $ / ...)
```

### ChangeType
```typescript
interface ChangeType {
    value: 'delete' | 'update'
}

ChangeType.fromString('update'); // Change type `update`
```

### ClubProperties
```typescript
interface ClubProperties {
    id: guid,
    name: string,
    identifier: string,
    regionCode: string,
    inAppPaymentActive: boolean
}
```

### DatabaseType
```typescript
interface DatabaseType {
    value: 'release' | 'debug' | 'testing'
}

DatabaseType.fromString('release'); // Database type `release`
```

### Fine
```typescript
interface Fine {
    id: guid,
    personId: guid,
    payedState: Updatable<PayedState>,
    number: number,
    date: Date,
    fineReason: FineReason
}
```

### FineReason
```typescript
interface FineReason {
    value: {
        reasonTemplateId: guid
    } | {
        reasonMessage: string,
        amount: Amount,
        importance: Importance
    }
}
```

### guid
```typescript
interface guid {
    guidString: string
}

guid.fromString('30950db9-e8f3-4408-9ace-8d34f286f0ff'); // `30950DB9-E8F3-4408-9ACE-8D34F286F0FF`
```

### Importance
```typescript
interface Importance {
    value: 'high' | 'medium' | 'low'
}

Importance.fromString('medium'); // Importance `medium`
```

### LatePaymentInterest
```typescript
interface TimePeriod {
    value: number,
    unit: 'day' | 'month' | 'year'
}

interface LatePaymentInterest {
    interestFreePeriod: TimePeriod,
    interestPeriod: TimePeriod,
    interestRate: number,
    compoundInterest: boolean
}
```

### PayedState
```typescript
interface PayedState {
    property: {
        state: 'payed',
        inApp: boolean,
        payDate: Date,
    } | {
        state: 'unpayed',
    } | {
        state: 'settled',
    }
}
```

### Person
```typescript
interface Person {
    id: guid,
    name: PersonName
}
```

### PersonName
```typescript
interface PersonName {
    first: string,
    last?: string
}
```

### PersonPropertiesWithIsAdmin
```typescript
interface PersonPropertiesWithIsAdmin {
    id: guid,
    signInDate: Date,
    isAdmin: boolean,
    name: PersonName
}
```

### PersonPropertiesWithUserId
```typescript
interface PersonPropertiesWithUserId {
    id: guid,
    signInDate: Date,
    userId: string,
    name: PersonName
}
```

### ReasonTemplate
```typescript
interface ReasonTemplate {
    id: guid,
    reasonMessage: string,
    amount: Amount,
    importance: Importance
}
```

### Updatable
```typescript
interface Updatable<T> {
    property: T,
    updateProperties: {
        timestamp: Date,
        personId: guid
    }
}
```
</details>

## Firebase Functions

### Change Fine Function
```typescript
async changeFine({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    changeType: ChangeType,
    updatableFine: Updatable<Fine | Deleted<guid>>
}): Promise<void>;
```

### Change Fine Payed Function
```typescript
async changeFinePayed({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    fineId: guid,
    updatablePayedState: Updatable<PayedState>
}): Promise<void>;
```

### Change Late Payment Interest Function
```typescript
async changeLatePaymentInterest({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    changeType: ChangeType,
    updatableInterest: Updatable<LatePaymentInterest | Deleted<null>>
}): Promise<void>;
```

### Change Person Function
```typescript
async changePerson({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    changeType: ChangeType,
    updatablePerson: Updatable<Person | Deleted<guid>>
}): Promise<void>;
```

### Change Reason Template Function
```typescript
async changeReasonTemplate({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    changeType: ChangeType,
    updatableReasonTemplate: Updatable<ReasonTemplate | Deleted<guid>>
}): Promise<void>;
```

### Exists Club With Identifier Function
```typescript
async existsClubWithIdentifier ({
    privateKey: string,
    databaseType: DatabaseType,
    identifier: string,
}): Promise<boolean>;
```

### Exists Person With User Id Function
```typescript
async existsPersonWithUserId({
    privateKey: string,
    databaseType: DatabaseType,
    userId: string
}): Promise<boolean>;
```

### Force Sign Out Function
```typescript
async forceSignOut ({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    personId: guid,
}): Promise<void>;
```

### Get Club Id Function
```typescript
async getClubId ({
    privateKey: string,
    databaseType: DatabaseType,
    identifier: string,
}): Promise<string>;
```

### Get Person Properties Function
```typescript
async getPersonProperties ({
    privateKey: string,
    databaseType: DatabaseType,
    userId: string,
}): Promise<{
    personProperties: PersonPropertiesWithIsAdmin.DatabaseObject,
    clubProperties: ClubProperties.DatabaseObject,
}>;
```

### New Club Function
```typescript
async newClub ({
    privateKey: string,
    databaseType: DatabaseType,
    clubProperties: ClubProperties,
    personProperties: PersonPropertiesWithUserId,
}): Promise<void>;
```

### Register Person Function
```typescript
async registerPerson ({
    privateKey: string,
    databaseType: DatabaseType,
    clubId: guid,
    personProperties: PersonPropertiesWithUserId,
}): Promise<ClubProperties>;
```
