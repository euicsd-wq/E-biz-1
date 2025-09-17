import { useMemo } from 'react';
import type { useTenderStore } from './useTenderStore';
import { InvoiceStatus, TenderStatus, TaskStatus, TeamMemberRole } from '../types';
import { calculateRemainingDays } from '../utils';
import type { TeamMember } from '../types';

export const useDashboardStats = (store: ReturnType<typeof useTenderStore>, currentUser: TeamMember) => {
    const { watchlist, tasks, expenses } = store;
    const isMember = currentUser.role === TeamMemberRole.MEMBER;

    return useMemo(() => {
        const relevantWatchlist = isMember ? watchlist.filter(item => item.assignedTeamMemberId === currentUser.id) : watchlist;
        const relevantTasks = isMember ? tasks.filter(task => task.assignedToId === currentUser.id) : tasks;

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

        const upcomingDeadlines = relevantWatchlist
            .filter(item => [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(item.status))
            .map(item => ({...item, remainingDays: calculateRemainingDays(item.tender.closingDate)}))
            .filter(item => item.remainingDays >= 0 && item.remainingDays <= 7)
            .sort((a, b) => a.remainingDays - b.remainingDays)
            .slice(0, 5);
        
        const priorityTasks = relevantTasks
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
        
        const tenderFunnelStats = {
            [TenderStatus.WATCHING]: 0,
            [TenderStatus.APPLYING]: 0,
            [TenderStatus.SUBMITTED]: 0,
        };
        watchlist.forEach(item => {
            if (item.status in tenderFunnelStats) {
                tenderFunnelStats[item.status as keyof typeof tenderFunnelStats]++;
            }
        });

        const recentActivity = relevantWatchlist
            .flatMap(item => item.activityLog || [])
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 7);
        
        const myActiveTenders = watchlist.filter(item => 
            item.assignedTeamMemberId === currentUser.id &&
            [TenderStatus.WATCHING, TenderStatus.APPLYING, TenderStatus.SUBMITTED].includes(item.status)
        ).length;

        const myOpenTasks = tasks.filter(task => 
            task.assignedToId === currentUser.id && 
            task.status !== TaskStatus.COMPLETED
        ).length;

        return {
            activeTenders: isMember ? myActiveTenders : activeTenders,
            totalRevenue,
            netProfit,
            pendingTasks: isMember ? myOpenTasks : pendingTasks,
            upcomingDeadlines,
            priorityTasks,
            tenderFunnelStats,
            recentActivity,
            myActiveTenders,
            myOpenTasks
        };
    }, [watchlist, tasks, expenses, currentUser, isMember]);
};