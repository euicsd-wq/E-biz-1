import { useMemo } from 'react';
import type { useTenderStore } from './useTenderStore';
import { InvoiceStatus, TenderStatus, TaskStatus } from '../types';
import { calculateRemainingDays } from '../utils';

export const useDashboardStats = (store: ReturnType<typeof useTenderStore>) => {
    const { watchlist, tasks, expenses } = store;

    return useMemo(() => {
        const allInvoices = watchlist.flatMap(item => 
            (item.invoices || []).map(invoice => ({ ...invoice }))
        );

        const activeTenders = watchlist.filter(t => [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(t.status)).length;
        
        const totalRevenue = allInvoices
            .filter(inv => inv.status === InvoiceStatus.PAID)
            .reduce((sum, inv) => sum + inv.amount, 0);

        const totalExpenses = (expenses || []).reduce((sum, exp) => sum + exp.amount, 0);

        const netProfit = totalRevenue - totalExpenses;

        const pendingTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED).length;

        const upcomingDeadlines = watchlist
            .filter(item => [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(item.status))
            .map(item => ({...item, remainingDays: calculateRemainingDays(item.tender.closingDate)}))
            .filter(item => item.remainingDays >= 0 && item.remainingDays <= 7)
            .sort((a, b) => a.remainingDays - b.remainingDays)
            .slice(0, 5);
        
        const priorityTasks = tasks
            .filter(task => {
                const dueDate = new Date(task.dueDate + 'T00:00:00');
                const today = new Date();
                today.setHours(0,0,0,0);
                const threeDaysFromNow = new Date();
                threeDaysFromNow.setDate(today.getDate() + 3);
                return task.status !== TaskStatus.COMPLETED && dueDate >= today && dueDate <= threeDaysFromNow;
            })
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);

        return {
            activeTenders,
            totalRevenue,
            netProfit,
            pendingTasks,
            upcomingDeadlines,
            priorityTasks,
        };
    }, [watchlist, tasks, expenses]);
};
