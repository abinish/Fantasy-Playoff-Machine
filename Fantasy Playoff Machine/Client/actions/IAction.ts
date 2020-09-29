export interface IAction<TType extends string, TPayload = void, TMeta = void> {
	type: TType;
	payload: TPayload;
	error?: boolean;
	meta?: TMeta;
}
