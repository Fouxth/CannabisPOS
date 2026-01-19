import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

// Global shortcuts registry
const shortcuts: ShortcutConfig[] = [];

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(config: ShortcutConfig[]) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            // Allow Escape key in inputs
            if (event.key !== 'Escape') return;
        }

        const matchingShortcut = config.find(shortcut => {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                event.code === shortcut.key;
            const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;

            return keyMatch && ctrlMatch && shiftMatch && altMatch;
        });

        if (matchingShortcut) {
            event.preventDefault();
            event.stopPropagation();
            matchingShortcut.action();
        }
    }, [config]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * POS-specific keyboard shortcuts
 */
export const POS_SHORTCUTS = {
    // Payment shortcuts
    CASH_PAYMENT: { key: 'F1', description: 'ชำระด้วยเงินสด' },
    CARD_PAYMENT: { key: 'F2', description: 'ชำระด้วยบัตร' },
    QR_PAYMENT: { key: 'F3', description: 'ชำระด้วย QR' },
    TRANSFER_PAYMENT: { key: 'F4', description: 'ชำระด้วยโอนเงิน' },

    // Cart actions
    CLEAR_CART: { key: 'F5', description: 'ล้างตะกร้า' },
    HOLD_ORDER: { key: 'F6', description: 'พักออเดอร์' },
    PRINT_RECEIPT: { key: 'F7', description: 'พิมพ์ใบเสร็จ' },
    OPEN_DRAWER: { key: 'F8', description: 'เปิดลิ้นชักเงิน' },

    // Navigation
    SEARCH_PRODUCT: { key: '/', ctrl: true, description: 'ค้นหาสินค้า' },
    TOGGLE_NUMPAD: { key: 'n', ctrl: true, description: 'เปิด/ปิด Numpad' },

    // Quick amounts
    AMOUNT_100: { key: '1', alt: true, description: 'รับเงิน ฿100' },
    AMOUNT_500: { key: '2', alt: true, description: 'รับเงิน ฿500' },
    AMOUNT_1000: { key: '3', alt: true, description: 'รับเงิน ฿1,000' },
    EXACT_AMOUNT: { key: 'e', ctrl: true, description: 'รับเงินพอดี' },

    // Quantity
    INCREASE_QTY: { key: 'ArrowUp', description: 'เพิ่มจำนวน' },
    DECREASE_QTY: { key: 'ArrowDown', description: 'ลดจำนวน' },
    DELETE_ITEM: { key: 'Delete', description: 'ลบรายการ' },

    // Global
    HELP: { key: '?', shift: true, description: 'แสดงช่วยเหลือ' },
    ESCAPE: { key: 'Escape', description: 'ยกเลิก/ปิด' },
} as const;

/**
 * Global application shortcuts
 */
export const GLOBAL_SHORTCUTS = {
    GOTO_POS: { key: 'p', ctrl: true, shift: true, description: 'ไปหน้า POS' },
    GOTO_DASHBOARD: { key: 'd', ctrl: true, shift: true, description: 'ไปหน้า Dashboard' },
    GOTO_PRODUCTS: { key: 'o', ctrl: true, shift: true, description: 'ไปหน้าสินค้า' },
    GOTO_REPORTS: { key: 'r', ctrl: true, shift: true, description: 'ไปหน้ารายงาน' },
    SEARCH: { key: 'k', ctrl: true, description: 'ค้นหา' },
    QUICK_SALE: { key: 's', ctrl: true, shift: true, description: 'ขายด่วน' },
} as const;

/**
 * Get formatted shortcut string for display
 */
export function formatShortcut(config: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
    const parts: string[] = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');

    // Format special keys
    let keyDisplay = config.key;
    if (config.key.startsWith('F')) {
        keyDisplay = config.key;
    } else if (config.key === 'ArrowUp') {
        keyDisplay = '↑';
    } else if (config.key === 'ArrowDown') {
        keyDisplay = '↓';
    } else if (config.key === 'Escape') {
        keyDisplay = 'Esc';
    } else if (config.key === 'Delete') {
        keyDisplay = 'Del';
    } else {
        keyDisplay = config.key.toUpperCase();
    }

    parts.push(keyDisplay);
    return parts.join(' + ');
}

/**
 * Get all shortcuts for help display
 */
export function getAllShortcuts(): Array<{ category: string; shortcuts: Array<{ name: string; keys: string; description: string }> }> {
    return [
        {
            category: 'การชำระเงิน',
            shortcuts: [
                { name: 'เงินสด', keys: formatShortcut(POS_SHORTCUTS.CASH_PAYMENT), description: POS_SHORTCUTS.CASH_PAYMENT.description },
                { name: 'บัตร', keys: formatShortcut(POS_SHORTCUTS.CARD_PAYMENT), description: POS_SHORTCUTS.CARD_PAYMENT.description },
                { name: 'QR', keys: formatShortcut(POS_SHORTCUTS.QR_PAYMENT), description: POS_SHORTCUTS.QR_PAYMENT.description },
                { name: 'โอน', keys: formatShortcut(POS_SHORTCUTS.TRANSFER_PAYMENT), description: POS_SHORTCUTS.TRANSFER_PAYMENT.description },
            ],
        },
        {
            category: 'ตะกร้าสินค้า',
            shortcuts: [
                { name: 'เพิ่มจำนวน', keys: formatShortcut(POS_SHORTCUTS.INCREASE_QTY), description: POS_SHORTCUTS.INCREASE_QTY.description },
                { name: 'ลดจำนวน', keys: formatShortcut(POS_SHORTCUTS.DECREASE_QTY), description: POS_SHORTCUTS.DECREASE_QTY.description },
                { name: 'ลบรายการ', keys: formatShortcut(POS_SHORTCUTS.DELETE_ITEM), description: POS_SHORTCUTS.DELETE_ITEM.description },
                { name: 'ล้างตะกร้า', keys: formatShortcut(POS_SHORTCUTS.CLEAR_CART), description: POS_SHORTCUTS.CLEAR_CART.description },
            ],
        },
        {
            category: 'นำทาง',
            shortcuts: [
                { name: 'POS', keys: formatShortcut(GLOBAL_SHORTCUTS.GOTO_POS), description: GLOBAL_SHORTCUTS.GOTO_POS.description },
                { name: 'Dashboard', keys: formatShortcut(GLOBAL_SHORTCUTS.GOTO_DASHBOARD), description: GLOBAL_SHORTCUTS.GOTO_DASHBOARD.description },
                { name: 'สินค้า', keys: formatShortcut(GLOBAL_SHORTCUTS.GOTO_PRODUCTS), description: GLOBAL_SHORTCUTS.GOTO_PRODUCTS.description },
                { name: 'ค้นหา', keys: formatShortcut(GLOBAL_SHORTCUTS.SEARCH), description: GLOBAL_SHORTCUTS.SEARCH.description },
            ],
        },
    ];
}
