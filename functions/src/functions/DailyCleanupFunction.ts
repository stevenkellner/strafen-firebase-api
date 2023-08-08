import { DatabaseType, FirebaseSchedule, UtcDate } from 'firebase-function';
import { baseDatabase } from '../utils';

export class DailyCleanupFunction implements FirebaseSchedule {

    public constructor(
        private readonly databaseType: DatabaseType
    ) {}

    public async executeFunction() {
        await Promise.all([
            this.clearChanges()
        ]);
    }

    private async clearChanges() {
        const clubsReference = baseDatabase(this.databaseType).child('clubs');
        const clubsSnapshot = await clubsReference.snapshot();
        if (!clubsSnapshot.exists)
            return;
        const allPromises: Promise<unknown>[] = [];
        const referenceDate = UtcDate.now.advanced({ day: -5 }).setted({ hour: 0, minute: 0 });
        const dateRegex = /^(?<date>\d{4}-\d{2}-\d{2}-\d{2}-\d{2})_[0-9A-Fa-f]{8}$/;
        clubsSnapshot.forEach(clubSnapshot => {
            const clubId = clubSnapshot.key!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            clubSnapshot.child('changes').forEach(changesSnapshot => {
                const type = changesSnapshot.key as 'persons' | 'reasonTemplates' | 'fines';
                changesSnapshot.forEach(changeSnapshot => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const date = UtcDate.decode(dateRegex.exec(changeSnapshot.value())!.groups!.date).setted({ hour: 0, minute: 0 });
                    if (date.compare(referenceDate) === 'less') {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        allPromises.push(clubsReference.child(clubId).child('changes').child(type).child(changeSnapshot.key!).remove());
                    }
                });
            });
        });
        await Promise.all(allPromises);
    }
}
