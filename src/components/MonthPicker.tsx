import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';

interface MonthPickerProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    className?: string;
}

export function MonthPicker({ currentDate, onDateChange, className }: MonthPickerProps) {
    return (
        <div className={`flex items-center gap-2 bg-background/50 p-1 rounded-lg border backdrop-blur-sm shadow-sm ${className}`}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateChange(subMonths(currentDate, 1))}
                className="h-8 w-8"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm sm:text-base min-w-[120px] text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: th })}
            </span>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateChange(addMonths(currentDate, 1))}
                className="h-8 w-8"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
