import {guid} from "./guid";

export class TypeOrId<Type extends {object: TypeObject}, TypeObject> {
    private readonly value: {name: "withType", value: Type} | {name: "onlyId", id: guid};

    private constructor(value: {name: "withType", value: Type} | {name: "onlyId", id: guid}) {
        this.value = value;
    }

    static withType<Type extends {object: TypeObject}, TypeObject>(value: Type): TypeOrId<Type, TypeObject> {
        return new TypeOrId<Type, TypeObject>({name: "withType", value: value});
    }

    static onlyId<Type extends {object: TypeObject}, TypeObject>(id: guid): TypeOrId<Type, TypeObject> {
        return new TypeOrId<Type, TypeObject>({name: "onlyId", id: id});
    }

    get ["object"](): TypeObject | {id: string} {
        if (this.value.name == "onlyId")
            return {id: this.value.id.guidString};
        return this.value.value.object;
    }
}
