/* eslint-disable max-len */
export const defaultTestClub = {
    'fines': {
        '02462A8B-107F-4BAE-A85B-EFF1F727C00F': {
            'date': '2011-10-13T10:42:38+0000',
            'number': 1,
            'payedState': {
                'state': 'unpayed',
            },
            'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            'fineReason': {
                'reasonTemplateId': '062FB0CB-F730-497B-BCF5-A4F907A6DCD5',
            },
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
        '0B5F958E-9D7D-46E1-8AEE-F52F4370A95A': {
            'date': '2011-09-13T10:42:38+0000',
            'number': 2,
            'payedState': {
                'payDate': '2011-09-13T10:42:38+0000',
                'state': 'payed',
                'inApp': false,
            },
            'personId': '76025DDE-6893-46D2-BC34-9864BB5B8DAD',
            'fineReason': {
                'amount': 1.1,
                'importance': 'medium',
                'reasonMessage': 'Das ist ein Test',
            },
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
        '1B5F958E-9D7D-46E1-8AEE-F52F4370A95A': {
            'date': '2011-09-13T10:42:38+0000',
            'number': 2,
            'payedState': {
                'payDate': '2011-09-13T10:42:38+0000',
                'state': 'payed',
                'inApp': true,
            },
            'personId': 'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9',
            'fineReason': {
                'amount': 1.1,
                'importance': 'medium',
                'reasonMessage': 'Das ist ein Test',
            },
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
    },
    'identifier': 'demo-team',
    'inAppPaymentActive': true,
    'name': 'Neuer Verein',
    'personUserIds': {
        'asdnfl': '76025DDE-6893-46D2-BC34-9864BB5B8DAD',
        'LpAaeCz0BQfDHVYw02KiCyoTMS13': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
    },
    'persons': {
        '76025DDE-6893-46D2-BC34-9864BB5B8DAD': {
            'name': {
                'first': 'Tommy',
                'last': 'Arkins',
            },
            'signInData': {
                'admin': false,
                'signInDate': '2011-09-13T10:42:38+0000',
                'userId': 'asdnfl',
            },
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
        '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7': {
            'creditCard': '( »\u0013MÏè¨òÄU\r{\u0000,Ô¢6v\u000FWÖGV¡5<Ù$ÄìYòFm¹Ó4c\u0018B+´lº©L\u0000î\u0013dðîÖË«9´3¨æW\u0017\u0006°?Isqß\u0010mBZ\u0017Í,\u001E;·E\f_ ÐÀÖF^@­E9»ÎJhU>¨³\u0019\u0005\'GZKñ±ÓÎ±',
            'name': {
                'first': 'Max',
                'last': 'Mustermann',
            },
            'signInData': {
                'admin': true,
                'signInDate': '2011-09-13T10:42:38+0000',
                'userId': 'LpAaeCz0BQfDHVYw02KiCyoTMS13',
            },
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
        'D1852AC0-A0E2-4091-AC7E-CB2C23F708D9': {
            'name': {
                'first': 'John',
                'last': 'Doe',
            },
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
    },
    'reasonTemplates': {
        '062FB0CB-F730-497B-BCF5-A4F907A6DCD5': {
            'amount': 10,
            'importance': 'high',
            'reasonMessage': 'Gelbe Karte Unsportlichkeit',
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
        '16805D21-5E8D-43E9-BB5C-7B4A790F0CE7': {
            'amount': 2,
            'importance': 'low',
            'reasonMessage': 'Mit Stutzen Auslaufen',
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
        '23A3412E-87DE-4A23-A08F-67214B8A8541': {
            'amount': 3,
            'importance': 'medium',
            'reasonMessage': 'Spiel Ausrüstung Vergessen',
            'updateProperties': {
                'timestamp': '2011-10-13T10:42:38+0000',
                'personId': '7BB9AB2B-8516-4847-8B5F-1A94B78EC7B7',
            },
        },
    },
    'regionCode': 'DE',
};
