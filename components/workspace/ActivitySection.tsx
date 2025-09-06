import React from 'react';
import { type ActivityLog, ActivityType } from '../../types';
import { formatTimeAgo } from '../../utils';
import {
    PlusIcon, TagIcon, PencilSquareIcon, TrashIcon, CurrencyDollarIcon, UsersGroupIcon,
    ShoppingBagIcon, ClipboardDocumentCheckIcon, ShieldCheckIcon, SparklesIcon,
    UploadIcon, InformationCircleIcon, BanknotesIcon, ChatBubbleLeftRightIcon
} from '../icons';

type ActivitySectionProps = {
    activityLog: ActivityLog[];
};

const ActivitySection: React.FC<ActivitySectionProps> = ({ activityLog }) => {
    const iconMap: Record<ActivityType, { icon: React.FC<any>, color: string }> = {
        [ActivityType.TENDER_ADDED]: { icon: PlusIcon, color: 'text-green-400' },
        [ActivityType.STATUS_CHANGE]: { icon: TagIcon, color: 'text-blue-400' },
        [ActivityType.NOTE_UPDATED]: { icon: PencilSquareIcon, color: 'text-yellow-400' },
        [ActivityType.QUOTE_ITEM_ADDED]: { icon: PlusIcon, color: 'text-green-400' },
        [ActivityType.QUOTE_ITEM_REMOVED]: { icon: TrashIcon, color: 'text-red-400' },
        [ActivityType.QUOTE_ITEM_UPDATED]: { icon: PencilSquareIcon, color: 'text-yellow-400' },
        [ActivityType.FINANCIALS_UPDATED]: { icon: PencilSquareIcon, color: 'text-yellow-400' },
        [ActivityType.PAYMENT_METHOD_UPDATED]: { icon: BanknotesIcon, color: 'text-cyan-400' },
        [ActivityType.INVOICE_CREATED]: { icon: CurrencyDollarIcon, color: 'text-green-400' },
        [ActivityType.INVOICE_UPDATED]: { icon: CurrencyDollarIcon, color: 'text-yellow-400' },
        [ActivityType.INVOICE_REMOVED]: { icon: CurrencyDollarIcon, color: 'text-red-400' },
        [ActivityType.TENDER_ASSIGNED]: { icon: UsersGroupIcon, color: 'text-purple-400' },
        [ActivityType.TASK_ASSIGNED]: { icon: ClipboardDocumentCheckIcon, color: 'text-cyan-400' },
        [ActivityType.PO_CREATED]: { icon: ShoppingBagIcon, color: 'text-green-400' },
        [ActivityType.DOCUMENT_UPLOADED]: { icon: UploadIcon, color: 'text-blue-400' },
        [ActivityType.DOCUMENT_REMOVED]: { icon: TrashIcon, color: 'text-red-400' },
        [ActivityType.EXPENSE_ADDED]: { icon: BanknotesIcon, color: 'text-green-400' },
        [ActivityType.EXPENSE_UPDATED]: { icon: BanknotesIcon, color: 'text-yellow-400' },
        [ActivityType.EXPENSE_REMOVED]: { icon: BanknotesIcon, color: 'text-red-400' },
        [ActivityType.TEMPLATE_APPLIED]: { icon: ClipboardDocumentCheckIcon, color: 'text-teal-400' },
        [ActivityType.RISK_ASSESSMENT_GENERATED]: { icon: ShieldCheckIcon, color: 'text-indigo-400' },
        [ActivityType.DOCUMENT_ANALYZED]: { icon: SparklesIcon, color: 'text-purple-400' },
        [ActivityType.COMMENT_ADDED]: { icon: ChatBubbleLeftRightIcon, color: 'text-teal-400' },
        [ActivityType.USER_MENTIONED]: { icon: UsersGroupIcon, color: 'text-purple-400' },
    };

    if (!activityLog || activityLog.length === 0) {
        return <p className="text-slate-400 text-center py-8">No activity recorded yet.</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-white mb-6">Activity Timeline</h2>
            <div className="relative border-l-2 border-slate-700 ml-4">
                <ul className="space-y-6">
                    {activityLog.map((log) => {
                        const { icon: Icon, color } = iconMap[log.type] || { icon: InformationCircleIcon, color: 'text-slate-400' };
                        return (
                            <li key={log.id} className="pl-8 relative">
                                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-slate-700 ring-4 ring-slate-800"></div>
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full bg-slate-900/50 ${color}`}>
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-slate-300">{log.description}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            <time dateTime={log.timestamp}>{formatTimeAgo(log.timestamp)}</time>
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default ActivitySection;