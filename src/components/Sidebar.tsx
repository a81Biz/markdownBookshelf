import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => (
    <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">MB | Bookshelf</h1>
        </div>
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Library</div>
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">grid_view</span>
                <span className="text-sm font-medium">All Books</span>
            </Link>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary transition-colors" href="#">
                <span className="material-symbols-outlined fill-icon">timer</span>
                <span className="text-sm font-medium">Current Reads</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="text-sm font-medium">Finished</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                <span className="material-symbols-outlined">favorite</span>
                <span className="text-sm font-medium">Wishlist</span>
            </a>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="size-10 rounded-full bg-cover bg-center ring-2 ring-white dark:ring-slate-800" style={{backgroundImage: 'url("https://picsum.photos/id/64/100/100")'}}></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">E. Vance</p>
                    <p className="text-xs text-slate-500 truncate">Premium Reader</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <span className="material-symbols-outlined text-xl">settings</span>
                </button>
            </div>
        </div>
    </aside>
);

export default Sidebar;
