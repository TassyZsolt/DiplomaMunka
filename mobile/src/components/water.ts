export interface WaterLog {
    id: string;
    userId: string;
    date: string;
    amountMl: number;
}

export interface WaterLogGoal {
    userId: string;
    targetMl: number;

}