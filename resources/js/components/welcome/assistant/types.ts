export type Step = 'sport' | 'field' | 'schedule' | 'client' | 'payment';

export type Slot = {
    start_time: string;
    end_time: string;
    available: boolean;
};

export type BotForm = {
    sport_type: string;
    field_id: string;
    date: string;
    start_time: string;
    duration_hours: string;
    document_type: 'dni' | 'ruc';
    document_number: string;
    client_name: string;
    client_phone: string;
    client_email: string;
    payment_method: 'yape' | 'plin';
    advance_amount: string;
    payment_operation_number: string;
    notes: string;
};

export type UpdateForm = <K extends keyof BotForm>(key: K, value: BotForm[K]) => void;
