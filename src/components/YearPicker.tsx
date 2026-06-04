import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addYears, subYears } from 'date-fns';

interface YearPickerProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    className?: string;
}

export function YearPicker({ currentDate, onDateChange, className }: YearPickerProps) {
    const displayYear = currentDate.getFullYear() + 543; // Show in Buddhist Era (พ.ศ.)

    return (
        <div className={`flex items-center gap-2 bg-background/50 p-1 rounded-lg border backdrop-blur-sm shadow-sm ${className}`}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateChange(subYears(currentDate, 1))}
                className="h-8 w-8"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm sm:text-base min-w-[100px] text-center capitalize">
                พ.ศ. {displayYear}
            </span>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateChange(addYears(currentDate, 1))}
                className="h-8 w-8"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
