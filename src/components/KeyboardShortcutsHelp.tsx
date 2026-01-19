import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getAllShortcuts } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
    const shortcutCategories = getAllShortcuts();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>คีย์ลัด (Keyboard Shortcuts)</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 mt-4">
                    {shortcutCategories.map((category) => (
                        <div key={category.category}>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                {category.category}
                            </h3>
                            <div className="space-y-2">
                                {category.shortcuts.map((shortcut) => (
                                    <div
                                        key={shortcut.name}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                                    >
                                        <span className="text-sm">{shortcut.description}</span>
                                        <kbd className="px-2 py-1 text-xs font-mono bg-background border rounded shadow-sm">
                                            {shortcut.keys}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
                    กด <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">Shift + ?</kbd> เพื่อเปิดหน้านี้ได้ทุกเวลา
                </div>
            </DialogContent>
        </Dialog>
    );
}
