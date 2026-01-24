import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface Book {
    id: number;
    title: string;
    author: string;
    cover: string;
    path: string | null;
}

const BookCard = ({ book }: { book: Book }) => {
    const { title, author, cover, path } = book;
    const navigate = useNavigate();

    const handleClick = () => {
        if (path) {
            navigate('/reader', { state: { book } });
        }
    };

    const isDisabled = !path;
    const cardClasses = `group ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

    return (
        <div className={cardClasses} onClick={!isDisabled ? handleClick : undefined}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${cover}")` }}></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
            </div>
            <div className="mt-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{author}</p>
            </div>
        </div>
    );
};

export default BookCard;
