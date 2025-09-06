import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { useTenderStore } from '../../hooks/useTenderStore';
import type { WatchlistItem, TeamMember } from '../../types';
import { getInitials, generateHslColorFromString, formatTimeAgo } from '../../utils';

type CollaborationSectionProps = { 
    tender: WatchlistItem; 
    store: ReturnType<typeof useTenderStore>; 
    currentUser: TeamMember 
};

const CollaborationSection: React.FC<CollaborationSectionProps> = ({ tender, store, currentUser }) => {
    const { teamMembers, addComment } = store;
    const [newComment, setNewComment] = useState('');
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const commentEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const teamMemberMap = useMemo(() => teamMembers.reduce((acc, m) => {
        acc[m.id] = m;
        return acc;
    }, {} as Record<string, TeamMember>), [teamMembers]);

    useEffect(() => {
        commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [tender.comments]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setNewComment(text);

        const atIndex = text.lastIndexOf('@');
        if (atIndex !== -1 && !text.substring(atIndex + 1).includes(' ')) {
            setMentionSearch(text.substring(atIndex + 1).toLowerCase());
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };
    
    const handleAddMention = (memberName: string) => {
        const atIndex = newComment.lastIndexOf('@');
        setNewComment(newComment.substring(0, atIndex) + `@${memberName} `);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim() === '') return;
        
        const mentions = [...newComment.matchAll(/@([a-zA-Z\s0-9_]+)/g)].map(match => match[1].trim());
        const mentionedIds = teamMembers
            .filter(m => mentions.some(mention => m.name.toLowerCase() === mention.toLowerCase()))
            .map(m => m.id);

        addComment(tender.tender.id, currentUser.id, newComment.trim(), mentionedIds);
        setNewComment('');
    };

    const mentionableUsers = teamMembers.filter(m => 
        m.name.toLowerCase().includes(mentionSearch) && m.id !== currentUser.id
    );

    return (
        <div className="flex flex-col h-full max-h-[70vh]">
            <h2 className="text-xl font-semibold text-white mb-4 flex-shrink-0">Collaboration</h2>
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                {(tender.comments || []).map(comment => {
                    const author = teamMemberMap[comment.authorId];
                    const isCurrentUser = author?.id === currentUser.id;
                    return (
                        <div key={comment.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            {author ? (
                                <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0" 
                                    style={{ backgroundColor: generateHslColorFromString(author.name) }} 
                                    title={author.name}
                                >
                                    {getInitials(author.name)}
                                </div>
                            ) : null}
                            <div className={`p-3 rounded-lg max-w-md ${isCurrentUser ? 'bg-blue-600' : 'bg-slate-700/70'}`}>
                                <p className="text-sm text-white whitespace-pre-wrap">{comment.text}</p>
                                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                                    {author?.name} &middot; {formatTimeAgo(comment.createdAt)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={commentEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-700 relative flex-shrink-0">
                {showMentions && mentionableUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full mb-1 bg-slate-600 border border-slate-500 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {mentionableUsers.map(user => (
                            <button 
                                key={user.id} 
                                type="button"
                                onClick={() => handleAddMention(user.name)}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-500"
                            >
                                {user.name}
                            </button>
                        ))}
                    </div>
                )}
                 <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 focus-within:border-blue-500 transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="Add a comment... Type @ to mention a team member."
                        className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none resize-none text-sm p-2 min-h-[60px]"
                        rows={3}
                    />
                    <div className="flex justify-end mt-1">
                        <button type="submit" className="btn-primary text-sm">Post</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CollaborationSection;