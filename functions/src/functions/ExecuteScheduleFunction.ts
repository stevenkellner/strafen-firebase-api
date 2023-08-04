import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, type FunctionType, HttpsError, FirebaseScheduleConstructor } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { getPrivateKeys } from '../privateKeys';
import { DailyCleanupFunction } from './DailyCleanupFunction';

export type ScheduleType = 'dailyCleanup'; 

export namespace ScheduleType {
    export function getSchedule(type: ScheduleType): FirebaseScheduleConstructor {
        switch (type) {
            case 'dailyCleanup':
                return DailyCleanupFunction;
        }
    }

    export function typeGuard(value: string): value is ScheduleType {
        return ['dailyCleanup'].includes(value);
    }
}

export class ExecuteScheduleFunction implements FirebaseFunction<ExecuteScheduleFunctionType> {
    public readonly parameters: FunctionType.Parameters<ExecuteScheduleFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('ExecuteScheduleFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<ExecuteScheduleFunctionType>>(
            {
                type: ParameterBuilder.guard('string', ScheduleType.typeGuard)
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<ExecuteScheduleFunctionType>> {
        this.logger.log('ExecuteScheduleFunction.executeFunction', {}, 'info');
        if (this.parameters.databaseType.value !== 'testing')
            throw HttpsError('failed-precondition', 'Function can only be called for testing.', this.logger);
        const Schedule = ScheduleType.getSchedule(this.parameters.type);
        const schedule = new Schedule(this.parameters.databaseType);
        await schedule.executeFunction();
    }
}

export type ExecuteScheduleFunctionType = FunctionType<{
    type: ScheduleType;
}, void>;
